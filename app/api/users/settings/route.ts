import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient as createServerClient } from '@/utils/supabase/server'

async function getUserFromRequest(request: NextRequest) {
  // Try cookie-based server client first
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) return user
  } catch (e) {
    // ignore and fallback to header
  }

  // Fallback: check Authorization header for Bearer token
  const auth = request.headers.get('authorization') || ''
  const match = auth.match(/^Bearer (.+)$/i)
  if (match) {
    const token = match[1]
    // Use Supabase REST to validate token via service role key
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      })
      if (res.ok) {
        const user = await res.json()
        return user
      }
    } catch (e) {
      // ignore
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If no DATABASE_URL configured, return defaults from user metadata
    if (!process.env.DATABASE_URL) {
      const fallback = {
        company: {
          companyName: user.user_metadata?.companyName || '',
          companyEmail: user.email || '',
          companyPhone: user.user_metadata?.companyPhone || '',
          companyAddress: user.user_metadata?.companyAddress || ''
        },
        notifications: {
          emailNotifications: true,
          overdueReminders: true,
          paymentNotifications: true,
          invoiceUpdates: true
        }
      }
      return NextResponse.json(fallback)
    }

    // Try fetch from Prisma user table
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      const fallback = {
        company: {
          companyName: user.user_metadata?.companyName || '',
          companyEmail: user.email || '',
          companyPhone: user.user_metadata?.companyPhone || '',
          companyAddress: user.user_metadata?.companyAddress || ''
        },
        notifications: {
          emailNotifications: true,
          overdueReminders: true,
          paymentNotifications: true,
          invoiceUpdates: true
        }
      }
      return NextResponse.json(fallback)
    }

    const settings = {
      company: {
        companyName: dbUser.businessName || '',
        companyEmail: dbUser.email || '',
        companyPhone: dbUser.phone || '',
        companyAddress: dbUser.address || ''
      },
      // Notifications are not stored as separate fields in Prisma schema;
      // return sensible defaults.
      notifications: {
        emailNotifications: true,
        overdueReminders: true,
        paymentNotifications: true,
        invoiceUpdates: true
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error in settings GET:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}
