import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check for any invoices with VOIDED status
    const voidedInvoices = await prisma.$queryRaw`
      SELECT COUNT(*) as count, status 
      FROM "Invoice" 
      WHERE status = 'VOIDED'
      GROUP BY status
    `
    
    // Also check all unique status values in the database
    const allStatuses = await prisma.$queryRaw`
      SELECT DISTINCT status, COUNT(*) as count
      FROM "Invoice" 
      GROUP BY status
      ORDER BY status
    `
    
    return NextResponse.json({
      voidedCount: voidedInvoices,
      allStatuses: allStatuses,
      message: 'Database status check complete'
    })
  } catch (error: any) {
    console.error('Database status check failed:', error)
    return NextResponse.json({
      error: error.message,
      code: error.code
    }, { status: 500 })
  }
}