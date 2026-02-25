'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { staffSchema, StaffFormData } from '@/lib/validations/staff'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'

export async function createStaff(data: StaffFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = staffSchema.parse(data)

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return { success: false, error: 'Bu email allaqachon ishlatilgan' }
    }

    // Check if staff code already exists
    const existingStaff = await db.staff.findUnique({
      where: {
        tenantId_staffCode: {
          tenantId,
          staffCode: validatedData.staffCode
        }
      }
    })

    if (existingStaff) {
      return { success: false, error: 'Bu xodim kodi allaqachon ishlatilgan' }
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password || 'Staff123!')

    // Create user — role MODERATOR so they access /admin with restricted permissions
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        passwordHash: hashedPassword,
        role: 'MODERATOR',
        tenantId,
        isActive: true,
      }
    })

    // Create staff
    const staff = await db.staff.create({
      data: {
        tenantId,
        userId: user.id,
        staffCode: validatedData.staffCode,
        position: validatedData.position,
        department: validatedData.department,
        education: validatedData.education,
        monthlySalary: validatedData.monthlySalary || null,
        ...(validatedData.monthlySalary && {
          salaryInfo: {
            monthlySalary: validatedData.monthlySalary,
            currency: 'UZS',
            lastUpdated: new Date().toISOString(),
          }
        }),
      }
    })

    revalidatePath('/admin/staff')
    revalidatePath('/admin')

    return { 
      success: true,
      userId: user.id,      // plain string - safe to serialize across server action boundary
      staffId: staff.id,    // plain string
      staff,
      message: `${validatedData.fullName} muvaffaqiyatli qo'shildi`,
      credentials: {
        email: validatedData.email,
        password: validatedData.password || 'Staff123!',
      }
    }
  } catch (error: any) {
    console.error('Create staff error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateStaff(staffId: string, data: Partial<Omit<StaffFormData, 'password' | 'email'>>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if staff exists
    const staff = await db.staff.findFirst({
      where: {
        id: staffId,
        tenantId
      },
      include: {
        user: true
      }
    })

    if (!staff) {
      return { success: false, error: 'Xodim topilmadi' }
    }

    const oldSalary = Number(staff.monthlySalary || 0)
    const newSalary = data.monthlySalary || 0

    // Update user
    await db.user.update({
      where: { id: staff.userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
      }
    })

    // Update staff
    const updatedStaff = await db.staff.update({
      where: { id: staffId },
      data: {
        staffCode: data.staffCode,
        position: data.position,
        department: data.department,
        education: data.education,
        monthlySalary: data.monthlySalary,
        ...(data.monthlySalary && {
          salaryInfo: {
            monthlySalary: data.monthlySalary,
            currency: 'UZS',
            lastUpdated: new Date().toISOString(),
          }
        }),
      }
    })

    // ✅ Update PENDING salary payments if monthlySalary changed
    if (data.monthlySalary !== undefined && newSalary !== oldSalary) {
      const pendingSalaries = await db.salaryPayment.findMany({
        where: {
          tenantId,
          staffId,
          type: 'FULL_SALARY', // ✅ To'liq oylik
          status: 'PENDING',
          paidAmount: 0 // ✅ Faqat hali to'lanmagan
        }
      })

      for (const salary of pendingSalaries) {
        await db.salaryPayment.update({
          where: { id: salary.id },
          data: {
            amount: newSalary,
            remainingAmount: newSalary,
            baseSalary: newSalary,
            salaryAmountAtPayment: newSalary // ✅ Snapshot
          }
        })
      }
    }

    revalidatePath('/admin/staff')
    revalidatePath(`/admin/staff/${staffId}`)
    revalidatePath(`/admin/staff/${staffId}/edit`)

    return { 
      success: true, 
      staff: updatedStaff,
      message: 'Xodim ma\'lumotlari yangilandi'
    }
  } catch (error: any) {
    console.error('Update staff error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteStaff(staffId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const staff = await db.staff.findFirst({
      where: {
        id: staffId,
        tenantId
      }
    })

    if (!staff) {
      return { success: false, error: 'Xodim topilmadi' }
    }

    // Delete staff (cascade will delete user too)
    await db.staff.delete({
      where: { id: staffId }
    })

    revalidatePath('/admin/staff')
    revalidatePath('/admin')

    return { success: true, message: 'Xodim o\'chirildi' }
  } catch (error: any) {
    console.error('Delete staff error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

// Reset staff password
export async function resetStaffPassword(staffId: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const staff = await db.staff.findFirst({
      where: {
        id: staffId,
        tenantId
      },
      include: {
        user: true
      }
    })

    if (!staff) {
      return { success: false, error: 'Xodim topilmadi' }
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' }
    }

    const hashedPassword = await hashPassword(newPassword)

    await db.user.update({
      where: {
        id: staff.userId
      },
      data: {
        passwordHash: hashedPassword
      }
    })

    revalidatePath('/admin/staff')
    revalidatePath(`/admin/staff/${staffId}`)
    revalidatePath(`/admin/staff/${staffId}/edit`)

    return { 
      success: true, 
      message: `${staff.user.fullName}ning paroli muvaffaqiyatli o'zgartirildi`
    }
  } catch (error: any) {
    console.error('Reset staff password error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}
