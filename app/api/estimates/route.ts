import { GET as createGET, POST as createPOST } from '@/lib/api-handler'
import { dbOperation } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'
import { CreateEstimateData } from '@/lib/types'

export const GET = createGET(
  async ({ dbUser }) => {
    const estimates = await dbOperation(
      () => prisma.estimate.findMany({
        where: {
          userId: dbUser!.id
        },
        select: {
          id: true,
          number: true,
          status: true,
          issueDate: true,
          validUntil: true,
          currency: true,
          subtotal: true,
          taxAmount: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      { operationName: 'Fetch estimates' }
    )

    return estimates.map(estimate => ({
      ...estimate,
      subtotal: Number(estimate.subtotal),
      taxAmount: Number(estimate.taxAmount),
      total: Number(estimate.total),
    }))
  },
  { cache: CacheConfigs.USER_DATA }
)

export const POST = createPOST(
  async ({ dbUser, request }) => {
    const data: CreateEstimateData = await request.json()
    
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const total = subtotal + 0

    const estimate = await dbOperation(
      () => prisma.estimate.create({
        data: {
          userId: dbUser!.id,
          customerId: data.customerId,
          number: data.number,
          issueDate: new Date(data.issueDate),
          validUntil: new Date(data.validUntil),
          currency: data.currency,
          subtotal: subtotal,
          taxAmount: 0,
          total: total,
          notes: data.notes,
          terms: data.terms,
          items: {
            create: data.items.map(item => ({
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          customer: true,
          items: true
        }
      }),
      { operationName: 'Create estimate' }
    )

    return {
      ...estimate,
      subtotal: Number(estimate.subtotal),
      taxAmount: Number(estimate.taxAmount),
      total: Number(estimate.total),
      items: estimate.items?.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }))
    }
  }
)