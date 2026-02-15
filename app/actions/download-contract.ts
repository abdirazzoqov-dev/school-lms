'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function downloadContract(contractId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get contract from database
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        tenantId,
        isActive: true,
      },
    })

    if (!contract) {
      return { success: false, error: 'Shartnoma topilmadi' }
    }

    // Check if user has access to this contract
    const hasAccess = await checkContractAccess(contract, session)
    if (!hasAccess) {
      return { success: false, error: 'Sizda bu shartnomani ko\'rish huquqi yo\'q' }
    }

    // Get file path
    const filePath = join(process.cwd(), 'public', contract.fileUrl)

    if (!existsSync(filePath)) {
      return { success: false, error: 'Fayl topilmadi' }
    }

    // Read file as base64
    const fileBuffer = await readFile(filePath)
    const base64 = fileBuffer.toString('base64')

    return {
      success: true,
      data: {
        base64,
        fileName: contract.fileName,
        fileType: contract.fileType,
      },
    }
  } catch (error) {
    console.error('Contract download error:', error)
    return { success: false, error: 'Faylni yuklashda xatolik' }
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

