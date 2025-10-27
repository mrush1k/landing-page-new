import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createClient as createServerClient } from '@/utils/supabase/server'

async function getUserFromRequest(request: Request) {
  // Try cookie-based server client
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) return user
  } catch (e) {}

  // Fallback to Authorization header Bearer token
  const auth = (request as any).headers?.get?.('authorization') || ''
  const match = auth.match?.(/^Bearer (.+)$/i)
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
    } catch (e) {
      // ignore
    }
  }

  return null
}

// Helper: resolve database user (try id -> fallback to email)
async function resolveDbUser(supabaseUser: any) {
  if (!supabaseUser) return null
  let dbUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } })
  if (!dbUser && supabaseUser.email) {
    dbUser = await prisma.user.findUnique({ where: { email: supabaseUser.email } })
  }
  return dbUser
}

function serializeUserTutorial(userTutorial: any) {
  return {
    id: userTutorial.id,
    userId: userTutorial.userId,
    tutorialId: userTutorial.tutorialId,
    completed: userTutorial.completed,
    currentStep: userTutorial.currentStep,
    completedAt: userTutorial.completedAt,
    createdAt: userTutorial.createdAt,
    updatedAt: userTutorial.updatedAt,
  }
}

// GET /api/tutorials/progress?tutorialId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tutorialId = searchParams.get('tutorialId')

    if (!process.env.DATABASE_URL) {
      // No DB configured: return null for single lookup or empty array for aggregated fetch
      if (tutorialId) {
        return NextResponse.json(null)
      }
      return NextResponse.json([])
    }

    const dbUser = await resolveDbUser(user)
    if (!dbUser) {
      if (tutorialId) {
        return NextResponse.json(null)
      }
      return NextResponse.json([])
    }

    if (!tutorialId) {
      const userTutorials = await prisma.userTutorial.findMany({
        where: { userId: dbUser.id },
      })

      return NextResponse.json(userTutorials.map(serializeUserTutorial))
    }

    const userTutorial = await prisma.userTutorial.findUnique({
      where: { userId_tutorialId: { userId: dbUser.id, tutorialId } },
    })

    if (!userTutorial) {
      // Return null when no record exists (not an object with false values)
      // This helps distinguish between "never seen" vs "started but not completed"
      return NextResponse.json(null)
    }

    return NextResponse.json(serializeUserTutorial(userTutorial))
  } catch (error) {
    console.error('Error fetching tutorial progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tutorials/progress
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tutorialId, completed, currentStep, completedAt } = await request.json()

    if (!tutorialId || currentStep === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      // No DB: return an ephemeral object
      return NextResponse.json({
        id: 'temp-' + Date.now(),
        userId: user.id,
        tutorialId,
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null,
        createdAt: new Date(),
      })
    }

    // Ensure DB user exists (try id then email). If missing, attempt to create a record.
    let dbUser = await resolveDbUser(user)
    if (!dbUser) {
      try {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'user_' + user.id.slice(0, 8),
            country: 'US',
            currency: 'USD',
            displayName: user.user_metadata?.name || 'User',
            firstName: user.user_metadata?.given_name || '',
            lastName: user.user_metadata?.family_name || '',
          },
        })
      } catch (createErr: any) {
        // If unique constraint on email, load existing by email
        if (createErr?.code === 'P2002') {
          dbUser = await prisma.user.findUnique({ where: { email: user.email || '' } })
        }
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User setup failed' }, { status: 500 })
    }

    const userTutorial = await prisma.userTutorial.upsert({
      where: { userId_tutorialId: { userId: dbUser.id, tutorialId } },
      update: {
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      create: {
        userId: dbUser.id,
        tutorialId,
        completed: completed || false,
        currentStep,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    })

    return NextResponse.json({
      id: userTutorial.id,
      userId: userTutorial.userId,
      tutorialId: userTutorial.tutorialId,
      completed: userTutorial.completed,
      currentStep: userTutorial.currentStep,
      completedAt: userTutorial.completedAt,
      createdAt: userTutorial.createdAt,
      updatedAt: userTutorial.updatedAt,
    })
  } catch (error) {
    console.error('Error creating tutorial progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tutorials/progress
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, tutorialId, completed, currentStep, completedAt } = await request.json()

    if (!id || !tutorialId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      // No DB: echo back as if updated
      return NextResponse.json({
        id,
        userId: user.id,
        tutorialId,
        completed: completed || false,
        currentStep: currentStep || 0,
        completedAt: completedAt ? new Date(completedAt) : null,
        updatedAt: new Date(),
      })
    }

    const dbUser = await resolveDbUser(user)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure the record exists and belongs to the user
    const existing = await prisma.userTutorial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tutorial progress not found' }, { status: 404 })
    }
    if (existing.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.userTutorial.update({
      where: { id },
      data: {
        completed: completed || false,
        currentStep: currentStep || 0,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    })

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      tutorialId: updated.tutorialId,
      completed: updated.completed,
      currentStep: updated.currentStep,
      completedAt: updated.completedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    console.error('Error updating tutorial progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
