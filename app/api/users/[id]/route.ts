import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only access their own data
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // If no DATABASE_URL is configured, return user data from Supabase auth instead of Prisma
    if (!process.env.DATABASE_URL) {
      const fallbackUserData = {
        id: user.id,
        email: user.email || '',
        username: user.email?.split('@')[0] || 'user',
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        firstName: user.user_metadata?.given_name || '',
        lastName: user.user_metadata?.family_name || '',
        country: 'US',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return NextResponse.json(fallbackUserData)
    }

    // Optimized: Single lookup with only needed fields
    const userData = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        firstName: true,
        lastName: true,
        country: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!userData) {
      // Fallback to Supabase data if not found in Prisma
      const fallbackUserData = {
        id: user.id,
        email: user.email || '',
        username: user.email?.split('@')[0] || 'user',
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        firstName: user.user_metadata?.given_name || '',
        lastName: user.user_metadata?.family_name || '',
        country: 'US',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return NextResponse.json(fallbackUserData)
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user can only update their own data
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = await request.json()
    
    // If no DATABASE_URL is configured, return success but don't persist to DB
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping user profile update - DATABASE_URL not configured')
      const fallbackResponse = {
        id: user.id,
        email: data.email || user.email || '',
        username: data.username || user.email?.split('@')[0] || 'user',
        displayName: data.displayName || user.user_metadata?.name || 'User',
        ...data,
        updatedAt: new Date()
      }
      return NextResponse.json(fallbackResponse)
    }
    
    const userData = await prisma.user.update({
      where: { id: id },
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        country: data.country,
        currency: data.currency,
        workType: data.workType,
        customWorkType: data.customWorkType,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        businessRegNumber: data.businessRegNumber,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        postalCode: data.postalCode,
        website: data.website,
        dateFormat: data.dateFormat,
        logoUrl: data.logoUrl,
      },
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}