'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { studentSchema, StudentFormData } from '@/lib/validations/student'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'
import { canAddStudent } from '@/lib/tenant'
import { handleError } from '@/lib/error-handler'
import { generateRandomString } from '@/lib/utils'
import { REVALIDATION_PATHS, revalidateMultiplePaths } from '@/lib/cache-config'
import { logger } from '@/lib/logger'

export async function createStudent(data: StudentFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if can add more students
    const canAdd = await canAddStudent(tenantId)
    if (!canAdd) {
      return { success: false, error: 'O\'quvchilar limitiga yetdingiz. Plan\'ni upgrade qiling.' }
    }

    // Validate data
    const validatedData = studentSchema.parse(data)

    // Check if student code already exists
    const existingStudent = await db.student.findUnique({
      where: {
        tenantId_studentCode: {
          tenantId,
          studentCode: validatedData.studentCode
        }
      }
    })

    if (existingStudent) {
      return { success: false, error: 'Bu o\'quvchi kodi allaqachon ishlatilgan' }
    }

    // Process guardians (multiple parents/guardians)
    const guardianResults = []
    const defaultPassword = await hashPassword('Parent123!') // Default password
    
    for (const guardianData of validatedData.guardians) {
      // Check if guardian phone already exists for this tenant
      let guardian = await db.parent.findFirst({
        where: {
          tenantId,
          user: {
            phone: guardianData.phone
          }
        },
        include: {
          user: true
        }
      })

      // If guardian doesn't exist, create new one
      if (!guardian) {
        // Generate unique email using phone (for authentication fallback)
        const guardianEmail = `parent_${guardianData.phone.replace(/[^0-9]/g, '')}@temp.local`
        
        // Check if this generated email already exists
        const existingEmail = await db.user.findUnique({
          where: { email: guardianEmail }
        })

        if (existingEmail) {
          return { 
            success: false, 
            error: `Qarindosh telefon raqami ${guardianData.phone} allaqachon ishlatilgan` 
          }
        }

        // Create guardian user account
        const guardianUser = await db.user.create({
          data: {
            email: guardianEmail, // Generated email
            fullName: guardianData.fullName,
            phone: guardianData.phone,
            passwordHash: defaultPassword,
            role: 'PARENT',
            tenantId,
            isActive: true,
          }
        })

        // Create parent/guardian record
        guardian = await db.parent.create({
          data: {
            tenantId,
            userId: guardianUser.id,
            guardianType: guardianData.guardianType,
            customRelationship: guardianData.customRelationship || null,
            occupation: guardianData.occupation || null,
            workAddress: guardianData.workAddress || null,
          },
          include: {
            user: true
          }
        })
      }

      guardianResults.push({
        guardian,
        hasAccess: guardianData.hasAccess
      })
    }

    // Create student user account (always create to save fullName)
    let studentUser = null
    
    // Generate email if not provided
    const studentEmail = validatedData.email || `${validatedData.studentCode.toLowerCase()}@student.local`
    
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: studentEmail }
    })

    if (existingUser) {
      return { success: false, error: 'Bu email allaqachon ishlatilgan' }
    }

    // Create student user account (always create to save fullName)
    const studentPassword = await hashPassword('Student123!')
    
    studentUser = await db.user.create({
      data: {
        email: studentEmail,
        fullName: validatedData.fullName,
        phone: guardianResults[0]?.guardian.user.phone || null, // Use first guardian's phone
        passwordHash: studentPassword,
        role: 'STUDENT',
        tenantId,
        isActive: true,
      }
    })

    // Calculate trial period dates if enabled
    let trialStartDate = null
    let trialEndDate = null
    
    if (validatedData.trialEnabled && validatedData.trialDays) {
      trialStartDate = new Date()
      trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + validatedData.trialDays)
    }

    // Create student
    const student = await db.student.create({
      data: {
        tenantId,
        userId: studentUser?.id || null,
        studentCode: validatedData.studentCode,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        gender: validatedData.gender,
        classId: validatedData.classId || null,
        address: validatedData.address || null,
        status: 'ACTIVE',
        // Trial period
        trialEnabled: validatedData.trialEnabled || false,
        trialStartDate,
        trialEndDate,
        trialDays: validatedData.trialDays || null,
        // Payment info
        monthlyTuitionFee: validatedData.monthlyTuitionFee || 0,
        paymentDueDay: validatedData.paymentDueDay || 5,
      }
    })

    // Link all guardians to student
    for (const result of guardianResults) {
      await db.studentParent.create({
        data: {
          studentId: student.id,
          parentId: result.guardian.id,
          hasAccess: result.hasAccess
        }
      })
    }

    // Create payment based on trial status and monthly fee
    // Faqat oylik to'lov summasi 0 dan katta bo'lsa to'lov yaratiladi
    const primaryGuardian = guardianResults.find(g => g.hasAccess)
    
    if (validatedData.monthlyTuitionFee > 0 && validatedData.trialEnabled && trialEndDate) {
      // Trial enabled: Create payment after trial ends
      // Calculate first payment due date (trial end date + 1 day)
      const firstPaymentDueDate = new Date(trialEndDate)
      firstPaymentDueDate.setDate(firstPaymentDueDate.getDate() + 1)
      
      // Create first monthly payment (will be due after trial ends)
      const invoiceNumber = `INV-${new Date().getFullYear()}-${generateRandomString(8)}`
      
      await db.payment.create({
        data: {
          tenantId,
          studentId: student.id,
          parentId: primaryGuardian?.guardian.id || null,
          amount: validatedData.monthlyTuitionFee,
          paymentType: 'TUITION',
          paymentMethod: 'CASH',
          status: 'PENDING',
          dueDate: firstPaymentDueDate,
          invoiceNumber,
          notes: `Oylik o'qish to'lovi (Sinov muddati tugagach: ${trialEndDate.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' }) || trialEndDate.toISOString().split('T')[0]})`,
        }
      })
    } else if (validatedData.monthlyTuitionFee > 0) {
      // No trial: Create payment immediately (only if fee > 0)
      const invoiceNumber = `INV-${new Date().getFullYear()}-${generateRandomString(8)}`
      
      // First payment due date is today (enrollment date)
      const firstPaymentDueDate = new Date()
      
      await db.payment.create({
        data: {
          tenantId,
          studentId: student.id,
          parentId: primaryGuardian?.guardian.id || null,
          amount: validatedData.monthlyTuitionFee,
          paymentType: 'TUITION',
          paymentMethod: 'CASH',
          status: 'PENDING',
          dueDate: firstPaymentDueDate,
          invoiceNumber,
          notes: `Oylik o'qish to'lovi`,
        }
      })
    }

    // Create dormitory assignment if needed
    if (validatedData.dormitoryBedId) {
      // Check if bed is available
      const bed = await db.dormitoryBed.findFirst({
        where: {
          id: validatedData.dormitoryBedId,
          tenantId,
          isOccupied: false,
          isActive: true,
        },
        include: {
          room: true,
        },
      })

      if (!bed) {
        return { success: false, error: 'Tanlangan joy band yoki mavjud emas' }
      }

      // Create dormitory assignment
      await db.dormitoryAssignment.create({
        data: {
          tenantId,
          studentId: student.id,
          roomId: bed.roomId,
          bedId: bed.id,
          monthlyFee: validatedData.dormitoryMonthlyFee || 0,
          status: 'ACTIVE',
          assignedById: session.user.id,
        },
      })

      // Mark bed as occupied
      await db.dormitoryBed.update({
        where: { id: bed.id },
        data: { isOccupied: true },
      })

      // Update room occupied count
      await db.dormitoryRoom.update({
        where: { id: bed.roomId },
        data: { occupiedBeds: { increment: 1 } },
      })

      // Update building cache
      const room = bed.room
      const buildingId = room.buildingId
      
      const rooms = await db.dormitoryRoom.findMany({
        where: { buildingId },
        select: {
          capacity: true,
          occupiedBeds: true,
        },
      })

      const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
      const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)

      await db.dormitoryBuilding.update({
        where: { id: buildingId },
        data: {
          totalCapacity,
          occupiedBeds,
        },
      })
    }

    // ✅ Revalidate multiple related paths
    revalidateMultiplePaths([...REVALIDATION_PATHS.STUDENT_CHANGED], revalidatePath)
    revalidatePath('/admin/students')
    revalidatePath('/admin/dormitory')
    
    logger.info('Student created successfully', {
      userId: session.user.id,
      tenantId,
      action: 'CREATE_STUDENT',
      resourceId: student.id,
    })
    
    return { 
      success: true, 
      student,
      guardianCredentials: primaryGuardian ? {
        phone: primaryGuardian.guardian.user.phone,
        password: 'Parent123!',
        fullName: primaryGuardian.guardian.user.fullName
      } : null
    }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateStudent(studentId: string, data: Partial<StudentFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if student code is being changed and is unique
    if (data.studentCode) {
      const existingStudent = await db.student.findFirst({
        where: {
          tenantId,
          studentCode: data.studentCode,
          NOT: { id: studentId }
        }
      })

      if (existingStudent) {
        return { success: false, error: 'Bu o\'quvchi kodi allaqachon ishlatilgan' }
      }
    }

    // Update student (with tenant check)
    const student = await db.student.update({
      where: { 
        id: studentId,
        tenantId, // Security: Ensure tenant isolation
      },
      data: {
        studentCode: data.studentCode,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        classId: data.classId || null,
        address: data.address || null,
      }
    })

    // ✅ Revalidate multiple related paths
    revalidateMultiplePaths([...REVALIDATION_PATHS.STUDENT_CHANGED], revalidatePath)
    revalidatePath('/admin/students')
    
    logger.info('Student updated successfully', {
      userId: session.user.id,
      tenantId,
      action: 'UPDATE_STUDENT',
      resourceId: studentId,
    })
    
    return { success: true, student }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deactivateStudent(studentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Update student status to EXPELLED (with tenant check)
    await db.student.update({
      where: { 
        id: studentId,
        tenantId, // Security: Ensure tenant isolation
      },
      data: { 
        status: 'EXPELLED',
        classId: null // Remove from class
      }
    })

    // ✅ Revalidate multiple related paths
    revalidateMultiplePaths([...REVALIDATION_PATHS.STUDENT_CHANGED], revalidatePath)
    revalidatePath('/admin/students')
    
    logger.info('Student deactivated successfully', {
      userId: session.user.id,
      tenantId,
      action: 'DEACTIVATE_STUDENT',
      resourceId: studentId,
    })
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteStudent(studentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get student with all related data
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: true,
        payments: true,
        _count: {
          select: {
            grades: true,
            attendances: true,
            payments: true,
          }
        }
      }
    })

    if (!student) {
      return { success: false, error: 'O\'quvchi topilmadi' }
    }

    // Check for unpaid/pending payments (PENDING or FAILED status)
    const unpaidPayments = student.payments.filter(
      payment => payment.status === 'PENDING' || payment.status === 'FAILED'
    )

    if (unpaidPayments.length > 0) {
      const totalUnpaid = unpaidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      return { 
        success: false, 
        error: `O'quvchida ${unpaidPayments.length} ta to'lanmagan to'lov mavjud (Jami: ${totalUnpaid.toLocaleString()} so'm). Avval barcha to'lovlarni to'lash kerak yoki to'lovlarni bekor qilish kerak.` 
      }
    }

    // If all payments are paid/cancelled, proceed with force deletion
    // Delete all related data in proper order (foreign key constraints)
    
    // 1. Delete grades
    if (student._count.grades > 0) {
      await db.grade.deleteMany({
        where: { studentId }
      })
    }

    // 2. Delete attendances
    if (student._count.attendances > 0) {
      await db.attendance.deleteMany({
        where: { studentId }
      })
    }

    // 3. Delete payments (all are paid/cancelled)
    if (student._count.payments > 0) {
      await db.payment.deleteMany({
        where: { studentId }
      })
    }

    // 4. Delete student-parent relations
    await db.studentParent.deleteMany({
      where: { studentId }
    })

    // 5. Free dormitory bed if occupied
    const dormitoryAssignment = await db.dormitoryAssignment.findUnique({
      where: { studentId }
    })
    if (dormitoryAssignment) {
      await db.dormitoryBed.update({
        where: { id: dormitoryAssignment.bedId },
        data: { isOccupied: false }
      })
      await db.dormitoryAssignment.delete({
        where: { studentId }
      })
    }

    // 6. Delete student record
    await db.student.delete({
      where: { 
        id: studentId,
        tenantId, // Security: Ensure tenant isolation
      }
    })

    // 7. Delete associated user account
    if (student.userId) {
      await db.user.delete({
        where: { id: student.userId }
      })
    }

    revalidatePath('/admin/students')
    
    return { 
      success: true,
      message: 'O\'quvchi va unga bog\'liq barcha ma\'lumotlar muvaffaqiyatli o\'chirildi'
    }
  } catch (error: any) {
    return handleError(error)
  }
}

// Bulk Operations
export async function bulkDeleteStudents(studentIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check which students are safe to delete
    const students = await db.student.findMany({
      where: { 
        id: { in: studentIds },
        tenantId 
      },
      include: {
        _count: {
          select: {
            grades: true,
            attendances: true,
            payments: true,
          }
        }
      }
    })

    const safeToDelete = students.filter(s => 
      s._count.grades === 0 && s._count.attendances === 0 && s._count.payments === 0
    )

    if (safeToDelete.length === 0) {
      return { 
        success: false, 
        error: 'Hech bir o\'quvchini o\'chirib bo\'lmaydi. Baholar, davomat yoki to\'lovlar mavjud.' 
      }
    }

    const safeIds = safeToDelete.map(s => s.id)

    // Delete student-parent relations
    await db.studentParent.deleteMany({
      where: { studentId: { in: safeIds } }
    })

    // Delete students
    const result = await db.student.deleteMany({
      where: { id: { in: safeIds } }
    })

    revalidatePath('/admin/students')
    
    return { 
      success: true, 
      deleted: result.count,
      skipped: studentIds.length - result.count
    }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function bulkChangeStudentStatus(studentIds: string[], status: 'ACTIVE' | 'GRADUATED' | 'EXPELLED') {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const result = await db.student.updateMany({
      where: { 
        id: { in: studentIds },
        tenantId 
      },
      data: { 
        status,
        // If expelled, remove from class
        ...(status === 'EXPELLED' ? { classId: null } : {})
      }
    })

    revalidatePath('/admin/students')
    
    return { success: true, updated: result.count }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function convertTrialToRegular(studentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Verify student exists and is in trial
    const student = await db.student.findFirst({
      where: { 
        id: studentId,
        tenantId,
        trialEnabled: true
      }
    })

    if (!student) {
      return { success: false, error: 'Sinov muddatidagi o\'quvchi topilmadi' }
    }

    // Convert trial to regular
    await db.student.update({
      where: { id: studentId },
      data: {
        trialEnabled: false,
        trialStartDate: null,
        trialEndDate: null,
        trialDays: null
      }
    })

    revalidatePath('/admin/students')
    revalidatePath(`/admin/students/${studentId}`)
    
    return { success: true, message: 'O\'quvchi asosiy o\'quvchilar ro\'yxatiga qo\'shildi' }
  } catch (error: any) {
    return handleError(error)
  }
}
