import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

import { prisma, withRetry } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, userMessage, botResponse, action, timestamp } = await request.json()
    
    if (!userId || !userMessage || !botResponse) {
      return NextResponse.json(
        { error: 'userId, userMessage, and botResponse are required' },
        { status: 400 }
      )
    }
    
    // Store interaction in database with retry logic
    const interaction = await withRetry(() =>
      prisma.chatbotInteraction.create({
        data: {
          userId,
          userMessage,
          botResponse,
          action: action ? JSON.stringify(action) : null,
          timestamp: new Date(timestamp || Date.now())
        }
      })
    )
    
    return NextResponse.json({ 
      success: true, 
      interactionId: interaction.id 
    })
    
  } catch (error) {
    console.error('Error logging chatbot interaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Add cache headers for better performance
    const headers = new Headers({
      'Cache-Control': 'private, max-age=180, stale-while-revalidate=30',
      'Content-Type': 'application/json'
    })
    
    // Get user's chatbot interaction history with retry logic and optimized query
    const interactions = await withRetry(() =>
      prisma.chatbotInteraction.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          id: true,
          userMessage: true,
          botResponse: true,
          action: true,
          timestamp: true
        }
      })
    )
    
    return NextResponse.json({ interactions }, { headers })
    
  } catch (error) {
    console.error('Error fetching chatbot interactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}