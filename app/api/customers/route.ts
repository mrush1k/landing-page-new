import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json([])
    }

    // Find database user record - fix the core issue here
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email: user.email || '' } })
    }
    if (!dbUser) {
      return NextResponse.json([])
    }

    // Optimized query - only fetch needed fields
    const customers = await prisma.customer.findMany({
      where: { userId: dbUser.id },
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
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      const data = await request.json()
      return NextResponse.json({
        id: 'temp-' + Date.now(),
        userId: user.id,
        displayName: data.displayName || 'Customer',
        ...data,
        createdAt: new Date()
      })
    }

    // Find or create database user
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    
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
          }
        })
      } catch (userError: any) {
        if (userError instanceof Prisma.PrismaClientKnownRequestError && userError.code === 'P2002') {
          dbUser = await prisma.user.findUnique({ where: { email: user.email || '' } })
        }
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User setup failed' }, { status: 500 })
    }

    const data = await request.json()
    
    if (!data.displayName?.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        userId: dbUser.id,
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
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error creating customer:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Customer already exists' }, { status: 400 })
      }
      if (error.code === 'P2003') {
        return NextResponse.json({ error: 'User account setup incomplete' }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
