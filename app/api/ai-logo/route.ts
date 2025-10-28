import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessName } = body

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' }, 
        { status: 400 }
      )
    }

    // Generate a simple text-based logo using Canvas API or a simple SVG
    const logoPrompt = `Create a modern, professional, minimalist logo for a business called "${businessName}". The text should be in a clean, bold, sans-serif font. Include a simple, stylized icon that represents the business seamlessly integrated with the text. Use a professional color scheme with good contrast. The design should be suitable for invoices and business documents.`
    
    let logoDataUrl: string = ''
    
    try {
      // Use gemini-2.5-flash-image model for image generation
      const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash-image' })
      
      const response = await model.generateContent(logoPrompt)

      const result = await response.response
      
      // Check if response contains image data in candidates
      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0]
        
        if (candidate.content && candidate.content.parts) {
          // Look for inline data (base64 image)
          for (const part of candidate.content.parts) {
            if ('inlineData' in part && part.inlineData) {
              const base64Data = part.inlineData.data
              const mimeType = part.inlineData.mimeType || 'image/png'
              logoDataUrl = `data:${mimeType};base64,${base64Data}`
              console.log('Gemini image generation successful for:', businessName)
              break
            }
          }
        }
      }
      
      // If no image data found, use fallback
      if (!logoDataUrl) {
        console.warn('Gemini did not return image data, using fallback')
        logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(generateSimpleTextLogo(businessName)).toString('base64')}`
      }
      
    } catch (geminiError) {
      console.warn('Gemini image generation failed, using fallback:', geminiError)
      // Fallback to simple text-based logo
      logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(generateSimpleTextLogo(businessName)).toString('base64')}`
    }

    // Save logo info to user database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        aiLogoUrl: logoDataUrl,
        aiLogoPrompt: logoPrompt,
        aiLogoGeneratedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      logoUrl: logoDataUrl,
      prompt: logoPrompt,
      generatedAt: updatedUser.aiLogoGeneratedAt,
    })

  } catch (error) {
    console.error('AI Logo generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate logo' }, 
      { status: 500 }
    )
  }
}

function generateSimpleTextLogo(businessName: string): string {
  const initials = businessName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3)

  const colors = ['#0066CC', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#EA580C']
  const primaryColor = colors[Math.floor(Math.random() * colors.length)]
  
  return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${primaryColor}CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#logoGradient)" />
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
            text-anchor="middle" dominant-baseline="central" fill="white">
        ${initials}
      </text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" fill="#333">
        ${businessName}
      </text>
    </svg>
  `.trim()
}