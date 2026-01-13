import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execSync } from 'child_process'

/**
 * Protected Seed Endpoint
 * 
 * Only SUPER_ADMIN can trigger seed script
 * 
 * Usage:
 * POST /api/admin/seed
 * Headers: Authorization (via NextAuth session)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only SUPER_ADMIN can trigger seed
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Only SUPER_ADMIN can trigger seed script'
        },
        { status: 401 }
      )
    }

    // Check if running in production
    if (process.env.NODE_ENV === 'production') {
      // In production, only allow if explicitly enabled
      if (process.env.ALLOW_SEED_IN_PRODUCTION !== 'true') {
        return NextResponse.json(
          { 
            error: 'Seed disabled in production',
            message: 'Set ALLOW_SEED_IN_PRODUCTION=true to enable'
          },
          { status: 403 }
        )
      }
    }

    console.log('🌱 Starting seed via API endpoint...')
    
    // Run seed script
    execSync('npm run db:seed', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production'
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Seed completed successfully'
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { 
        error: 'Seed failed',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

