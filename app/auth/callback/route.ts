import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

async function ensureUserRecord(user: NonNullable<{ id: string; email?: string | null; user_metadata?: Record<string, any> }>) {
  if (!process.env.DATABASE_URL) {
    console.warn('Skipping DB user creation during OAuth callback because DATABASE_URL is not set.')
    return
  }

  try {
    const email = user.email || ''
    const [existingUserById, existingUserByEmail] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, select: { id: true } }),
      email ? prisma.user.findUnique({ where: { email }, select: { id: true } }) : Promise.resolve(null)
    ])

    if (existingUserById) {
      return
    }

    if (existingUserByEmail) {
      console.warn(`OAuth callback: user with email ${email} already exists (id=${existingUserByEmail.id}). Skipping create.`)
      return
    }

    await prisma.user.create({
      data: {
        id: user.id,
        email,
        username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
        country: 'US',
        currency: 'USD',
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        firstName: user.user_metadata?.given_name || '',
        lastName: user.user_metadata?.family_name || '',
      }
    })
    console.log('Created user record during OAuth callback:', user.id)
  } catch (dbError: any) {
    if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2002') {
      console.warn('Ignored Prisma P2002 (unique constraint) during OAuth user create; skipping create.')
      return
    }

    console.error('Unexpected error ensuring user during OAuth callback:', dbError)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // After successful OAuth, ensure user exists in Prisma database
      try {
        const user = data?.user
        if (user) {
          ensureUserRecord(user).catch((dbError) => {
            console.error('Error creating user in database during OAuth callback (non-fatal):', dbError)
          })
        }
      } catch (dbError) {
        console.error('Error reading user during OAuth callback (non-fatal):', dbError)
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}