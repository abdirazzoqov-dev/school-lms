import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// GET - Fetch tenant settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.tenantId) {
      return NextResponse.json(
        { error: 'Autentifikatsiya talab qilinadi' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ruxsat berilmagan' },
        { status: 403 }
      )
    }

    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Maktab topilmadi' },
        { status: 404 }
      )
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Get tenant settings error:', error)
    return NextResponse.json(
      { error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

// PUT - Update tenant settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.tenantId) {
      return NextResponse.json(
        { error: 'Autentifikatsiya talab qilinadi' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ruxsat berilmagan' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const name = formData.get('name') as string
    const address = formData.get('address') as string | null
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null
    const logoFile = formData.get('logo') as File | null

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Maktab nomi to\'ldirish majburiy' },
        { status: 400 }
      )
    }

    let logoPath = null

    // Handle logo upload
    if (logoFile) {
      // Validate file size (2MB)
      if (logoFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Fayl hajmi 2MB dan kichik bo\'lishi kerak' },
          { status: 400 }
        )
      }

      // Validate file type
      if (!logoFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Faqat rasm fayllarini yuklash mumkin' },
          { status: 400 }
        )
      }

      // Save file
      const bytes = await logoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create unique filename
      const timestamp = Date.now()
      const extension = logoFile.name.split('.').pop()
      const filename = `logo-${session.user.tenantId}-${timestamp}.${extension}`
      
      // Save to public/uploads
      const path = join(process.cwd(), 'public', 'uploads', filename)
      await writeFile(path, buffer)

      logoPath = `/uploads/${filename}`
    }

    // Update tenant
    const updateData: any = {
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
    }

    if (logoPath) {
      updateData.logo = logoPath
    }

    const updatedTenant = await db.tenant.update({
      where: { id: session.user.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
      },
    })

    return NextResponse.json({
      message: 'Maktab ma\'lumotlari yangilandi',
      tenant: updatedTenant,
    })
  } catch (error) {
    console.error('Update tenant settings error:', error)
    return NextResponse.json(
      { error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

