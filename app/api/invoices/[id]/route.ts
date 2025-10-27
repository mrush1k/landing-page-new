import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: id,
        userId: user.id,
        deletedAt: null // Only show non-deleted invoices
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      items: invoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: invoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Verify the invoice belongs to the user
    const existingInvoice = await prisma.invoice.findUnique({
      where: { 
        id: id,
        userId: user.id 
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: id },
      data: {
        status: data.status,
        ...data,
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...updatedInvoice,
      subtotal: Number(updatedInvoice.subtotal),
      taxAmount: Number(updatedInvoice.taxAmount),
      total: Number(updatedInvoice.total),
      items: updatedInvoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: updatedInvoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fast auth check - JWT validation only (no network call)
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await request.json().catch(() => ({}))

    // Optimized: Single query with minimal data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        _count: {
          select: { payments: true } // Just count, don't load payments
        }
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Allow deletion for all invoice statuses. Previously only DRAFT invoices were deletable.
    // Keep soft-delete semantics and a payments-confirmation flow for safety.

    // Warning if invoice has payments
    const hasPayments = invoice._count.payments > 0
    if (hasPayments && !requestData.confirmWithPayments) {
      return NextResponse.json({ 
        error: 'This invoice has payment records. Deleting will hide the invoice but preserve payment history for audit purposes.',
        requiresConfirmation: true 
      }, { status: 400 })
    }

    // If caller requests, remove associated records (payments/items) to keep DB clean.
    // This is optional and must be explicitly requested to avoid accidental data loss.
    const removeAssociated = !!requestData.removeAssociated

    const txOps: any[] = []
    if (removeAssociated) {
      // Delete dependent records first to avoid FK surprises when doing physical deletes.
      txOps.push(
        prisma.payment.deleteMany({ where: { invoiceId: id } }),
        prisma.invoiceItem.deleteMany({ where: { invoiceId: id } })
      )
    }

    // Soft delete the invoice and create an audit log entry in a transaction
    txOps.push(
      prisma.invoice.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
          deleteReason: requestData.reason || null,
          updatedAt: new Date(),
        },
      }),
      prisma.invoiceAuditLog.create({
        data: {
          invoiceId: id,
          userId: user.id,
          action: 'DELETED',
          reason: requestData.reason || null,
          oldStatus: invoice.status,
          newStatus: 'DELETED',
        },
      })
    )

    await prisma.$transaction(txOps)

    return NextResponse.json({
      message: 'Invoice deleted successfully',
      hasPaymentsWarning: hasPayments,
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}