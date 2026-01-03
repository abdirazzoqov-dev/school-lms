import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    // Revalidate all paths
    revalidatePath('/', 'layout')
    
    return NextResponse.json({
      success: true,
      message: 'Cache tozalandi',
      revalidated: true,
      now: Date.now()
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Cache tozalashda xatolik' },
      { status: 500 }
    )
  }
}

