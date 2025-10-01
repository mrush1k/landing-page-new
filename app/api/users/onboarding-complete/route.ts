import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If no DATABASE_URL is configured, return success but don't persist to DB
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping onboarding complete update - DATABASE_URL not configured')
      return NextResponse.json({ message: 'Onboarding marked as complete' })
    }

    // Resolve DB user: try by id, fallback to email
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser && user.email) {
      dbUser = await prisma.user.findUnique({ where: { email: user.email } })
    }

    // If still not found, attempt to create a DB user record (handle OAuth users)
    if (!dbUser) {
      try {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'user_' + user.id.slice(0, 8),
            country: 'US',
            currency: 'USD',
            displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          },
        })
      } catch (e: any) {
        // If unique constraint prevents create, try to load by email again
        if (e?.code === 'P2002' && user.email) {
          dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        }
      }
    }

    if (!dbUser) {
      // Can't resolve DB user; return a safe success so client proceeds, but log for diagnostics
      console.warn('Onboarding: could not resolve or create DB user for', user.id)
      return NextResponse.json({ message: 'Onboarding marked as complete' })
    }

    // Update user to mark onboarding as completed using the DB user's id
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { onboardingCompleted: true },
    })

    return NextResponse.json({ message: 'Onboarding marked as complete' })
  } catch (error) {
    console.error('Error marking onboarding complete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}