import { GET as createGET, PUT as createPUT, DELETE as createDELETE } from '@/lib/api-handler'
import { dbOperation, serializeInvoice } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return createGET(
    async ({ dbUser }) => {
      const customer = await dbOperation(
        () => prisma.customer.findFirst({
          where: { 
            id,
            userId: dbUser!.id
          },
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
            },
          },
        }),
        { operationName: 'Fetch customer' }
      )

      if (!customer) {
        throw Object.assign(new Error('Customer not found'), { statusCode: 404 })
      }

      return {
        ...customer,
        invoices: customer.invoices?.map(serializeInvoice)
      }
    },
    { cache: CacheConfigs.USER_DATA }
  )(request as any)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return createPUT(
    async ({ dbUser, request }) => {
      const data = await request.json()

      if (!data.displayName || data.displayName.trim() === '') {
        throw Object.assign(new Error('Display name is required'), { statusCode: 400 })
      }

      const customer = await dbOperation(
        () => prisma.customer.update({
          where: { 
            id,
            userId: dbUser!.id
          },
          data: {
            displayName: data.displayName.trim(),
            firstName: data.firstName?.trim() || null,
            lastName: data.lastName?.trim() || null,
            businessName: data.businessName?.trim() || null,
            email: data.email?.trim() || null,
            phone: data.phone?.trim() || null,
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            state: data.state?.trim() || null,
            zipCode: data.zipCode?.trim() || null,
            country: data.country?.trim() || null,
            businessRegNumber: data.businessRegNumber?.trim() || null,
          },
        }),
        { operationName: 'Update customer' }
      )

      return customer
    }
  )(request as any)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  return createDELETE(
    async ({ dbUser }) => {
      await dbOperation(
        () => prisma.customer.delete({
          where: { 
            id,
            userId: dbUser!.id
          },
        }),
        { operationName: 'Delete customer' }
      )

      return { success: true }
    }
  )(request as any)
}