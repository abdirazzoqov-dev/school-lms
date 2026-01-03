import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let settings = await db.globalSettings.findFirst()

    if (!settings) {
      // Create default settings if none exist
      settings = await db.globalSettings.create({
        data: {
          platformName: 'School LMS',
          platformDescription: 'Maktab boshqaruv tizimiga xush kelibsiz',
          supportPhone: '+998 71 123 45 67',
          defaultLanguage: 'uz',
          timezone: 'Asia/Tashkent',
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching global settings:', error)
    // Return default values on error
    return NextResponse.json({
      platformName: 'School LMS',
      platformDescription: 'Maktab boshqaruv tizimiga xush kelibsiz',
      supportPhone: '+998 71 123 45 67',
      defaultLanguage: 'uz',
      timezone: 'Asia/Tashkent',
    })
  }
}

