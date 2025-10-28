import { GET as createGET } from '@/lib/api-handler'
import { dbOperation } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'

export const GET = createGET(
  async ({ dbUser }) => {
    const settings = {
      company: {
        companyName: dbUser!.businessName || '',
        companyEmail: dbUser!.email || '',
        companyPhone: dbUser!.phone || '',
        companyAddress: dbUser!.address || ''
      },
      notifications: {
        emailNotifications: true,
        overdueReminders: true,
        paymentNotifications: true,
        invoiceUpdates: true
      }
    }

    return settings
  },
  { cache: CacheConfigs.STATIC }
)
