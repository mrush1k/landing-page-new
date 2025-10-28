import { GET as createGET, PUT as createPUT, DELETE as createDELETE } from '@/lib/api-handler'
import { dbOperation, QueryBuilders, serializeInvoice, serializePayment } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return createGET(
    async ({ dbUser }) => {
      const invoice = await dbOperation(
        () => prisma.invoice.findFirst({
          where: {
            id,
            userId: dbUser!.id,
            deletedAt: null
          },
          include: {
            customer: true,
            items: true,
            payments: true,
          },
        }),
        { operationName: 'Fetch invoice detail' }
      )

      if (!invoice) {
        throw Object.assign(new Error('Invoice not found'), { statusCode: 404 })
      }

      return {
        ...serializeInvoice(invoice),
        payments: invoice.payments?.map(serializePayment)
      }
    },
    { cache: CacheConfigs.USER_DATA }
  )(request as any)
}


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return createPUT(
    async ({ dbUser, request }) => {
      const data = await request.json()

      // Verify invoice exists and belongs to user
      const existingInvoice = await dbOperation(
        () => prisma.invoice.findFirst({
          where: {
            id,
            userId: dbUser!.id
          },
        }),
        { operationName: 'Verify invoice ownership' }
      )

      if (!existingInvoice) {
        throw Object.assign(new Error('Invoice not found'), { statusCode: 404 })
      }

      const updatedInvoice = await dbOperation(
        () => prisma.invoice.update({
          where: { id },
          data: {
            status: data.status,
            ...data,
          },
          include: {
            customer: true,
            items: true,
            payments: true,
          },
        }),
        { operationName: 'Update invoice' }
      )

      return {
        ...serializeInvoice(updatedInvoice),
        payments: updatedInvoice.payments?.map(serializePayment)
      }
    }
  )(request as any)
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return createDELETE(
    async ({ dbUser, supabaseUser, request }) => {
      const requestData = await request.json().catch(() => ({}))

      // Optimized: Single query with minimal data
      const invoice = await dbOperation(
        () => prisma.invoice.findFirst({
          where: {
            id,
            userId: dbUser!.id,
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            _count: {
              select: { payments: true }
            }
          },
        }),
        { operationName: 'Fetch invoice for deletion' }
      )

      if (!invoice) {
        throw Object.assign(new Error('Invoice not found'), { statusCode: 404 })
      }

      // Warning if invoice has payments
      const hasPayments = invoice._count.payments > 0
      if (hasPayments && !requestData.confirmWithPayments) {
        throw Object.assign(
          new Error('This invoice has payment records. Deleting will hide the invoice but preserve payment history for audit purposes.'),
          { statusCode: 400, requiresConfirmation: true }
        )
      }

      // Build transaction operations
      const removeAssociated = !!requestData.removeAssociated
      const txOps: any[] = []

      if (removeAssociated) {
        txOps.push(
          prisma.payment.deleteMany({ where: { invoiceId: id } }),
          prisma.invoiceItem.deleteMany({ where: { invoiceId: id } })
        )
      }

      // Soft delete the invoice and create audit log
      txOps.push(
        prisma.invoice.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: supabaseUser!.id,
            deleteReason: requestData.reason || null,
            updatedAt: new Date(),
          },
        }),
        prisma.invoiceAuditLog.create({
          data: {
            invoiceId: id,
            userId: supabaseUser!.id,
            action: 'DELETED',
            reason: requestData.reason || null,
            oldStatus: invoice.status,
            newStatus: 'DELETED',
          },
        })
      )

      await dbOperation(
        () => prisma.$transaction(txOps),
        { operationName: 'Delete invoice transaction' }
      )

      return {
        message: 'Invoice deleted successfully',
        hasPaymentsWarning: hasPayments,
      }
    }
  )(request as any)
}