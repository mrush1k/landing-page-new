import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')?.value

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET || 'fallback-secret') as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        aiLogoUrl: true,
        aiLogoPrompt: true,
        aiLogoGeneratedAt: true,
        logoUrl: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Logo fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logo data' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie or authorization header
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')?.value
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || authCookie

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Convert file to base64 data URL for simplicity
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update user profile with new logo URL
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { logoUrl: dataUrl }
    })

    return NextResponse.json({ 
      logoUrl: dataUrl,
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { logoUrl } = body

    if (!logoUrl) {
      return NextResponse.json(
        { error: 'Logo URL is required' }, 
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')?.value

    if (!authCookie) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET || 'fallback-secret') as { id: string }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { logoUrl },
    })

    return NextResponse.json({
      success: true,
      logoUrl: updatedUser.logoUrl,
    })

  } catch (error) {
    console.error('Logo update error:', error)
    return NextResponse.json(
      { error: 'Failed to update logo' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_token')?.value
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || authCookie

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string }

    // Update user profile to remove logo URL
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: { logoUrl: null }
    })

    return NextResponse.json({ message: 'Logo deleted successfully' })

  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}