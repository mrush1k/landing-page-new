import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient as createServerClient } from '@/utils/supabase/server'

async function getUserFromRequest(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) return user
  } catch (e) {}

  const auth = request.headers.get('authorization') || ''
  const match = auth.match(/^Bearer (.+)$/i)
  if (match) {
    const token = match[1]
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      })
      if (res.ok) return await res.json()
    } catch (e) {}
  }

  return null
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()

    if (!process.env.DATABASE_URL) {
      console.warn('Skipping company settings update - DATABASE_URL not configured')
      return NextResponse.json({ success: true })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        businessName: data.companyName || undefined,
        email: data.companyEmail || undefined,
        phone: data.companyPhone || undefined,
        address: data.companyAddress || undefined,
      }
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json({ error: 'Failed to update company settings' }, { status: 500 })
  }
}
