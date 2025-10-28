import { GET as createGET, POST as createPOST } from '@/lib/api-handler'
import { dbOperation, QueryBuilders, serializeInvoice } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'

export const GET = createGET(
  async ({ dbUser, request }) => {
    // Pagination
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50)
    const offset = parseInt(searchParams.get('offset') || '0') || 0

    const invoices = await dbOperation(
      () => prisma.invoice.findMany({
        ...QueryBuilders.userScoped(prisma.invoice, dbUser!.id),
        include: {
          customer: { select: { id: true, displayName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      { operationName: 'Fetch invoices' }
    )

    return invoices.map(serializeInvoice)
  },
  { cache: CacheConfigs.USER_DATA }
)

export const POST = createPOST(
  async ({ dbUser, request }) => {
    const data = await request.json()

    if (!data.items || data.items.length === 0) {
      throw Object.assign(new Error('Invoice must have at least one item'), { statusCode: 400 })
    }

    const subtotal = data.items.reduce((sum: number, item: any) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      return sum + (qty * price)
    }, 0)
    const total = subtotal + (Number(data.taxAmount) || 0)

    // Ensure customer exists or create
    let customerId = data.customerId
    let customer: any = null

    if (customerId) {
      customer = await prisma.customer.findFirst({ where: { id: customerId, userId: dbUser!.id } })
      if (!customer) throw Object.assign(new Error('Invalid customer ID or customer does not belong to user'), { statusCode: 400 })
    } else if (data.customerName || data.customerEmail) {
      customer = await prisma.customer.findFirst({ where: { email: data.customerEmail || '', userId: dbUser!.id } })
      if (!customer) {
        customer = await prisma.customer.create({ data: { userId: dbUser!.id, displayName: data.customerName || 'Customer', email: data.customerEmail || '' } })
      }
      customerId = customer.id
    } else {
      throw Object.assign(new Error('Customer ID or customer information (name/email) is required'), { statusCode: 400 })
    }

    if (!data.invoiceNumber) throw Object.assign(new Error('Invoice number is required'), { statusCode: 400 })

    const invoice = await dbOperation(
      () => prisma.invoice.create({
        data: {
          userId: dbUser!.id,
          customerId,
          number: data.invoiceNumber,
          issueDate: new Date(data.invoiceDate || new Date()),
          dueDate: new Date(data.dueDate || new Date()),
          currency: data.currency || 'USD',
          subtotal: isNaN(subtotal) ? 0 : subtotal,
          taxAmount: Number(data.taxAmount) || 0,
          taxInclusive: Boolean(data.taxInclusive),
          total: isNaN(total) ? 0 : (data.totalAmount || total),
          status: (data.status || 'draft').toUpperCase() as any,
          poNumber: data.poNumber || null,
          notes: data.notes || null,
          items: {
            create: data.items.map((item: any) => ({
              description: item.description || 'Item',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              total: Number(item.total) || (Number(item.quantity || 1) * Number(item.unitPrice || 0))
            }))
          }
        },
        include: { customer: true, items: true, payments: true }
      }),
      { operationName: 'Create invoice' }
    )

    // Serialize decimals
    return serializeInvoice(invoice)
  },
  { cache: false, createUserIfMissing: true }
)