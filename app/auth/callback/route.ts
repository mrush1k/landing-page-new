import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // After successful OAuth, ensure user exists in Prisma database
      try {
        // Guard Prisma usage: only attempt to access the database when a DATABASE_URL is configured.
        // This prevents build-time or environment-less runs from trying to connect and throwing Prisma errors.
        if (process.env.DATABASE_URL) {
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            // Check if user already exists in Prisma by id
            const existingUserById = await prisma.user.findUnique({
              where: { id: user.id }
            })

            if (!existingUserById) {
              // Also check for existing user with the same email to avoid unique constraint errors
              const email = user.email || ''
              const existingUserByEmail = email ? await prisma.user.findUnique({ where: { email } }) : null

              if (existingUserByEmail) {
                // There is already an account with this email (perhaps created via another provider).
                // Log and skip creating a new user record to avoid P2002 unique constraint errors.
                console.warn(`OAuth callback: user with email ${email} already exists (id=${existingUserByEmail.id}). Skipping create.`)
              } else {
                try {
                  // Create user record for OAuth user
                  await prisma.user.create({
                    data: {
                      id: user.id,
                      email: email,
                      username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
                      country: 'US', // Default values
                      currency: 'USD',
                      displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                      firstName: user.user_metadata?.given_name || '',
                      lastName: user.user_metadata?.family_name || '',
                    }
                  })
                  console.log('Created user record during OAuth callback:', user.id)
                } catch (createError: any) {
                  // Handle unique constraint race (P2002) defensively — another process may have created the same email concurrently.
                  if (
                    createError instanceof Prisma.PrismaClientKnownRequestError &&
                    createError.code === 'P2002'
                  ) {
                    console.warn('Ignored Prisma P2002 (unique constraint) during OAuth user create; skipping create.')
                  } else {
                    // Log other create errors but don't break the OAuth flow.
                    console.error('Unexpected error creating user during OAuth callback:', createError)
                  }
                }
              }
            }
          }
        } else {
          // No DATABASE_URL configured; skip DB user creation. This keeps the OAuth flow functional in envs
          // where the app is built/run without a connected database (for example during static builds or CI).
          console.warn('Skipping DB user creation during OAuth callback because DATABASE_URL is not set.')
        }
      } catch (dbError) {
        // Log the DB error but do not block the OAuth redirect flow. This prevents Prisma connection issues
        // from breaking the login process for end users.
        console.error('Error creating user in database during OAuth callback (non-fatal):', dbError)
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