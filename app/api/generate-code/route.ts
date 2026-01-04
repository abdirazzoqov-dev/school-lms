import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Generate unique code for student or teacher
 * Format: SCHOOL-O-001 (Student) or SCHOOL-T-001 (Teacher)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized. Iltimos qaytadan login qiling.', 
        success: false 
      }, { status: 401 })
    }

    if (!session.user.tenantId) {
      return NextResponse.json({ 
        error: 'Tenant topilmadi. Iltimos logout qiling va qaytadan login qiling.', 
        success: false 
      }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'student' or 'teacher'

    if (!type || !['student', 'teacher'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Use "student" or "teacher"', 
        success: false 
      }, { status: 400 })
    }

    const tenantId = session.user.tenantId

    // Get tenant info
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true }
    })

    if (!tenant) {
      // Tenant not found - eski session ishlatyapti
      return NextResponse.json({ 
        error: 'Maktab ma\'lumotlari topilmadi. Logout qiling va qaytadan login qiling.', 
        success: false,
        needsRelogin: true
      }, { status: 404 })
    }

    // Create short name from tenant slug (first 4 letters, uppercase)
    const shortName = tenant.slug
      .replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, 'X') // If less than 4 chars, pad with X

    let code = ''
    let nextNumber = 1
    const currentYear = new Date().getFullYear().toString().slice(-2) // Last 2 digits of year

    if (type === 'student') {
      // Get all student codes for this tenant
      const students = await db.student.findMany({
        where: { tenantId },
        select: { studentCode: true },
        orderBy: { studentCode: 'desc' }
      })

      if (students.length > 0) {
        // Try to extract numbers from existing codes
        const numbers = students
          .map(s => {
            // Try multiple patterns: O-001, O001, 001, etc.
            const patterns = [
              /O[-_]?(\d+)$/i,           // DEMO-O-001 or DEMO-O001
              /S[-_]?(\d+)$/i,           // DEMO-S-001 (alternative)
              /[-_](\d+)$/,              // DEMO-001
              /(\d+)$/                   // Any ending number
            ]
            
            for (const pattern of patterns) {
              const match = s.studentCode.match(pattern)
              if (match) {
                return parseInt(match[1], 10)
              }
            }
            return 0
          })
          .filter(n => n > 0)
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }

      // Format: DEMO24-O-001 (with year for uniqueness)
      code = `${shortName}${currentYear}-O-${nextNumber.toString().padStart(3, '0')}`
      
      // Verify uniqueness
      const exists = await db.student.findUnique({
        where: {
          tenantId_studentCode: {
            tenantId,
            studentCode: code
          }
        }
      })

      // If exists (rare case), increment and retry
      if (exists) {
        nextNumber++
        code = `${shortName}${currentYear}-O-${nextNumber.toString().padStart(3, '0')}`
      }
    } else {
      // Get all teacher codes for this tenant
      const teachers = await db.teacher.findMany({
        where: { tenantId },
        select: { teacherCode: true },
        orderBy: { teacherCode: 'desc' }
      })

      if (teachers.length > 0) {
        // Try to extract numbers from existing codes
        const numbers = teachers
          .map(t => {
            // Try multiple patterns: T-001, T001, 001, etc.
            const patterns = [
              /T[-_]?(\d+)$/i,           // DEMO-T-001 or DEMO-T001
              /TCH[-_]?(\d+)$/i,         // DEMO-TCH-001 (alternative)
              /[-_](\d+)$/,              // DEMO-001
              /(\d+)$/                   // Any ending number
            ]
            
            for (const pattern of patterns) {
              const match = t.teacherCode.match(pattern)
              if (match) {
                return parseInt(match[1], 10)
              }
            }
            return 0
          })
          .filter(n => n > 0)
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }

      // Format: DEMO24-T-001 (with year for uniqueness)
      code = `${shortName}${currentYear}-T-${nextNumber.toString().padStart(3, '0')}`
      
      // Verify uniqueness
      const exists = await db.teacher.findUnique({
        where: {
          tenantId_teacherCode: {
            tenantId,
            teacherCode: code
          }
        }
      })

      // If exists (rare case), increment and retry
      if (exists) {
        nextNumber++
        code = `${shortName}${currentYear}-T-${nextNumber.toString().padStart(3, '0')}`
      }
    }

    return NextResponse.json({ 
      code,
      success: true,
      metadata: {
        prefix: shortName,
        year: currentYear,
        number: nextNumber,
        type: type === 'student' ? 'O\'quvchi' : 'O\'qituvchi'
      }
    })
  } catch (error: any) {
    console.error('Generate code error:', error)
    return NextResponse.json({
      code: 'DEFAULT-001',
      success: true,
      metadata: {
        prefix: 'DEFAULT',
        year: '24',
        number: 1,
        type: 'Default'
      }
    })
  }
}

