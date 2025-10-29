import { GET as createGET, POST as createPOST } from '@/lib/api-handler'
import { dbOperation } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const GET = createGET(
  async ({ dbUser }) => {
    const customers = await dbOperation(
      () => prisma.customer.findMany({
        where: { userId: dbUser!.id },
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          businessName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      { operationName: 'Fetch customers' }
    )

    return customers
  },
  { cache: CacheConfigs.USER_DATA }
)

export const POST = createPOST(
  async ({ dbUser, request }) => {
    const data = await request.json()
    
    if (!data.displayName?.trim()) {
      throw Object.assign(new Error('Display name is required'), { statusCode: 400 })
    }

    const customer = await dbOperation(
      () => prisma.customer.create({
        data: {
          userId: dbUser!.id,
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
        }
      }),
      { operationName: 'Create customer' }
    )

    return customer
  },
  { createUserIfMissing: true }
)
