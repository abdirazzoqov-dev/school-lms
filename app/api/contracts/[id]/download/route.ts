import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Ruxsat berilmagan' },
        { status: 401 }
      )
    }

    const tenantId = session.user.tenantId!
    const contractId = params.id

    // Get contract from database
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        tenantId,
        isActive: true,
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Shartnoma topilmadi' },
        { status: 404 }
      )
    }

    // Check if user has access to this contract
    const hasAccess = await checkContractAccess(contract, session)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Sizda bu shartnomani ko\'rish huquqi yo\'q' },
        { status: 403 }
      )
    }

    // Get file path
    const filePath = join(process.cwd(), 'public', contract.fileUrl)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Fayl topilmadi' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contract.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(contract.fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Contract download error:', error)
    return NextResponse.json(
      { error: 'Faylni yuklashda xatolik' },
      { status: 500 }
    )
  }
}

async function checkContractAccess(contract: any, session: any): Promise<boolean> {
  const userId = session.user.id
  const role = session.user.role

  // Admin always has access
  if (role === 'ADMIN') {
    return true
  }

  // Check if contract is for teachers
  if (contract.forTeachers && role === 'TEACHER') {
    // If specific teacher is set, check if it matches
    if (contract.teacherId) {
      const teacher = await db.teacher.findUnique({
        where: { userId },
      })
      return teacher?.id === contract.teacherId
    }
    // General for all teachers
    return true
  }

  // Check if contract is for staff
  if (contract.forStaff) {
    const staff = await db.staff.findUnique({
      where: { userId },
    })
    if (staff) {
      // If specific staff is set, check if it matches
      if (contract.staffId) {
        return staff.id === contract.staffId
      }
      // General for all staff
      return true
    }
  }

  // Check if contract is for parents
  if (contract.forParents && role === 'PARENT') {
    // If specific parent is set, check if it matches
    if (contract.parentId) {
      const parent = await db.parent.findUnique({
        where: { userId },
      })
      return parent?.id === contract.parentId
    }
    // General for all parents
    return true
  }

  return false
}

