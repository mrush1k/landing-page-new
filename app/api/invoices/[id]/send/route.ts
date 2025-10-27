import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'
import { InvoiceStatus } from '@/lib/types'
import { randomUUID } from 'crypto'
import { generateInvoicePDF } from '@/lib/pdf-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoiceId = id
    
    // Parse request body with error handling
    let body: any = {}
    try {
      const rawBody = await request.text()
      console.log('Raw request body:', rawBody)
      
      if (rawBody.trim()) {
        body = JSON.parse(rawBody)
      } else {
        console.log('Empty request body, using defaults')
      }
    } catch (error) {
      console.error('Error parsing request body:', error)
      // Continue with empty body - we'll use customer email as fallback
    }
    
    const { 
      recipientEmail = '', 
      ccEmails = '', 
      message = '' 
    } = body

    // Fetch invoice with relations
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: invoiceId,
        userId: user.id 
      },
      include: {
        customer: true,
        items: true,
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if email credentials are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please set up SMTP credentials in environment variables.' 
      }, { status: 500 })
    }

    // Use customer email if no recipient email provided
    const emailRecipient = recipientEmail || invoice.customer?.email
    if (!emailRecipient) {
      console.log('No email recipient found:', { 
        recipientEmail, 
        customerEmail: invoice.customer?.email,
        customerId: invoice.customer?.id,
        body 
      })
      return NextResponse.json({ 
        error: 'No recipient email provided and customer has no email address. Please add an email to the customer or specify a recipient email.' 
      }, { status: 400 })
    }

    console.log('Sending invoice email:', {
      invoiceId,
      invoiceNumber: invoice.number,
      emailRecipient,
      ccEmails,
      hasMessage: !!message
    })

    // Duplicate email prevention - check if email was sent recently (within 5 seconds for instant UX)
    if (invoice.lastEmailSentAt) {
      const timeSinceLastEmail = Date.now() - new Date(invoice.lastEmailSentAt).getTime()
      const fiveSecondsInMs = 5 * 1000
      if (timeSinceLastEmail < fiveSecondsInMs) {
        return NextResponse.json({ 
          error: 'Email was sent recently. Please wait before sending again to prevent duplicates.' 
        }, { status: 429 })
      }
    }

    // Generate unique tracking ID for this email (instant)
    const trackingId = randomUUID()

    // Update invoice with queued email info immediately to provide fast response
    const updateDataImmediate: any = {
      sentTo: emailRecipient,
      lastEmailSentAt: new Date(),
      emailCount: (invoice.emailCount || 0) + 1,
      trackingId: trackingId,
      deliveryStatus: 'queued',
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      updateDataImmediate.status = InvoiceStatus.SENT
      updateDataImmediate.sentAt = new Date()
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateDataImmediate,
    })

    // Log the queued send
    console.log(`Invoice ${invoice.number} queued to be sent to ${emailRecipient} by user ${user.id} (email #${updateDataImmediate.emailCount})`)

    // Kick off background send (fire-and-forget) - ALL heavy work moved here
    ;(async () => {
      try {
        // Get fresh data and user profile
        const [freshInvoice, freshUserProfile] = await Promise.all([
          prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, customer: true, payments: true } }),
          prisma.user.findUnique({ where: { id: user.id } })
        ])

        if (!freshInvoice || !freshUserProfile) {
          throw new Error('Invoice or user profile not found in background send')
        }

        // Get transporter
        const { getTransporter } = await import('@/lib/email')
        const transporter = getTransporter()

        // Generate all email content in background
        const businessName = freshUserProfile.businessName || freshUserProfile.username || 'Your Business'
        const formattedBusinessName = businessName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
        const sanitizedBusinessName = formattedBusinessName.replace(/[^a-zA-Z0-9]/g, '')
        const pdfFilename = `Invoice-${freshInvoice.number}-${sanitizedBusinessName}.pdf`
        
        const emailSubject = `${formattedBusinessName} – Invoice #${freshInvoice.number} for ${formatCurrency(Number(freshInvoice.total), freshInvoice.currency)}`
        
        const emailBody = `Hi ${freshInvoice.customer?.displayName || 'Customer'},

Please find your invoice attached. Let us know if you have any questions. Thanks for your business!

--- Invoice Details ---
• Business Name: ${businessName}
• Invoice Number: ${freshInvoice.number}
• Invoice Total: ${formatCurrency(Number(freshInvoice.total), freshInvoice.currency)}
• Due Date: ${new Date(freshInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${message ? `\n--- Custom Message ---\n${message}\n` : ''}

Best regards,
${businessName}
${freshUserProfile.email}`

        const baseUrl = 'https://final-google-supa-invoice.vercel.app'
        const emailHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${freshInvoice.number}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .invoice-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .summary-label { font-weight: bold; color: #495057; }
        .summary-value { color: #0066cc; }
        .message-box { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
        .footer { text-align: center; border-top: 2px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; }
        .business-info { font-weight: bold; color: #0066cc; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color: #0066cc; margin: 0;">${businessName}</h1>
        <p style="color: #6c757d; margin: 10px 0 0 0;">Invoice #${freshInvoice.number}</p>
    </div>
    <div class="greeting">
        Hi ${freshInvoice.customer?.displayName || 'Customer'},<br><br>
        Please find your invoice attached. Let us know if you have any questions. Thanks for your business!
    </div>
    <div class="invoice-summary">
        <div class="summary-row">
            <span class="summary-label">Business Name:</span>
            <span class="summary-value">${businessName}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Invoice Number:</span>
            <span class="summary-value">${freshInvoice.number}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Invoice Total:</span>
            <span class="summary-value">${formatCurrency(Number(freshInvoice.total), freshInvoice.currency)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Due Date:</span>
            <span class="summary-value">${new Date(freshInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
    </div>
    ${message ? `<div class="message-box"><strong>Custom Message:</strong><br>${message}</div>` : ''}
    <div class="footer">
        <div class="business-info">${businessName}</div>
        <div>${freshUserProfile.email}</div>
        <div style="margin-top: 15px; font-size: 14px;">Thank you for your business!</div>
    </div>
    <img src="${baseUrl}/api/webhooks/email-tracking?trackingId=${trackingId}" width="1" height="1" style="display:none;" alt="">
</body>
</html>`

        // Prepare CC list
        let ccList: string[] = []
        if (ccEmails) {
          ccList = ccEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email)
        }
        if (freshUserProfile.alwaysCcSelf && !ccList.includes(freshUserProfile.email)) {
          ccList.push(freshUserProfile.email)
        }

        // Generate PDF for attachment
        const invoiceForPDF = {
          ...freshInvoice,
          subtotal: Number(freshInvoice.subtotal),
          taxAmount: Number(freshInvoice.taxAmount),
          total: Number(freshInvoice.total),
          items: freshInvoice.items?.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })) || []
        }

        const pdfDoc = generateInvoicePDF(invoiceForPDF as any, freshUserProfile as any)
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'))

        // Perform the actual send
        await transporter.sendMail({
          from: `"${businessName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: emailRecipient,
          cc: ccList.length > 0 ? ccList : undefined,
          bcc: freshUserProfile.email,
          subject: emailSubject,
          text: emailBody,
          html: emailHtml,
          attachments: [
            {
              filename: pdfFilename,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        })

        // Update invoice delivery status
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            deliveryStatus: 'sent',
            emailDelivered: true,
          }
        })

        console.log(`Invoice ${freshInvoice.number} successfully sent to ${emailRecipient}`)
      } catch (bgError) {
        console.error('Background email send failed for invoice', invoiceId, bgError)
        try {
          await prisma.invoice.update({ where: { id: invoiceId }, data: { deliveryStatus: 'failed' } })
        } catch (e) {
          console.error('Failed to update invoice deliveryStatus after email failure', e)
        }
      }
    })()

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice queued for sending',
      sentTo: emailRecipient,
      sentAt: new Date().toISOString(),
      emailCount: updateDataImmediate.emailCount,
      trackingId: trackingId,
      statusUpdated: invoice.status === InvoiceStatus.DRAFT,
    })

  } catch (error) {
    console.error('Error sending invoice email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: `Failed to send invoice email: ${errorMessage}`,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    )
  }
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}