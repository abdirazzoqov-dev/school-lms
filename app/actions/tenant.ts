'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { tenantSchema, TenantFormData } from '@/lib/validations/tenant'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'

export async function createTenant(data: TenantFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // Validate data
    const validatedData = tenantSchema.parse(data)

    // Check if slug already exists
    const existingTenant = await db.tenant.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingTenant) {
      return { success: false, error: 'Bu slug allaqachon ishlatilgan' }
    }

    // Calculate trial end date
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + (validatedData.trialDays || 30))

    // Set limits based on plan
    const limits = {
      BASIC: { maxStudents: 50, maxTeachers: 10 },
      STANDARD: { maxStudents: 200, maxTeachers: 30 },
      PREMIUM: { maxStudents: 9999, maxTeachers: 9999 }
    }

    const planLimits = limits[validatedData.subscriptionPlan]

    // Create tenant
    const tenant = await db.tenant.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        status: 'TRIAL',
        subscriptionPlan: validatedData.subscriptionPlan,
        trialEndsAt,
        maxStudents: planLimits.maxStudents,
        maxTeachers: planLimits.maxTeachers,
      }
    })

    // Create default admin user for the tenant
    const adminEmail = `admin@${validatedData.slug}.uz`
    const adminPassword = await hashPassword('Admin123!') // Default password

    await db.user.create({
      data: {
        email: adminEmail,
        fullName: 'Maktab Administratori',
        passwordHash: adminPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true,
      }
    })

    revalidatePath('/super-admin/tenants')
    
    return { 
      success: true, 
      tenant,
      adminCredentials: {
        email: adminEmail,
        password: 'Admin123!'
      }
    }
  } catch (error: any) {
    console.error('Create tenant error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateTenant(tenantId: string, data: Partial<TenantFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // If slug is being changed, check uniqueness
    if (data.slug) {
      const existingTenant = await db.tenant.findFirst({
        where: { 
          slug: data.slug,
          NOT: { id: tenantId }
        }
      })

      if (existingTenant) {
        return { success: false, error: 'Bu slug allaqachon ishlatilgan' }
      }
    }

    // Calculate new limits if plan changed
    let updateData: any = {
      name: data.name,
      slug: data.slug,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    }

    if (data.subscriptionPlan) {
      const limits = {
        BASIC: { maxStudents: 50, maxTeachers: 10 },
        STANDARD: { maxStudents: 200, maxTeachers: 30 },
        PREMIUM: { maxStudents: 9999, maxTeachers: 9999 }
      }
      const planLimits = limits[data.subscriptionPlan]
      updateData.subscriptionPlan = data.subscriptionPlan
      updateData.maxStudents = planLimits.maxStudents
      updateData.maxTeachers = planLimits.maxTeachers
    }

    const tenant = await db.tenant.update({
      where: { id: tenantId },
      data: updateData
    })

    revalidatePath('/super-admin/tenants')
    
    return { success: true, tenant }
  } catch (error: any) {
    console.error('Update tenant error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'TRIAL' | 'GRACE_PERIOD' | 'SUSPENDED' | 'BLOCKED') {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // If blocking, deactivate all users
    if (status === 'BLOCKED') {
      await db.user.updateMany({
        where: { tenantId },
        data: { isActive: false }
      })
    }

    // If activating, reactivate all users
    if (status === 'ACTIVE' || status === 'TRIAL') {
      await db.user.updateMany({
        where: { tenantId },
        data: { isActive: true }
      })
    }

    await db.tenant.update({
      where: { id: tenantId },
      data: { status }
    })

    revalidatePath('/super-admin/tenants')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function blockTenant(tenantId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // Block tenant and deactivate all users
    await db.$transaction([
      db.tenant.update({
        where: { id: tenantId },
        data: { status: 'BLOCKED' }
      }),
      db.user.updateMany({
        where: { tenantId },
        data: { isActive: false }
      })
    ])

    revalidatePath('/super-admin/tenants')
    
    return { success: true, message: 'Maktab va barcha xodimlar bloklandi' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function unblockTenant(tenantId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // Unblock tenant and activate all users
    await db.$transaction([
      db.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' }
      }),
      db.user.updateMany({
        where: { tenantId },
        data: { isActive: true }
      })
    ])

    revalidatePath('/super-admin/tenants')
    
    return { success: true, message: 'Maktab va barcha xodimlar faollashtirildi' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteTenant(tenantId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // Check if tenant has any data
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            users: true,
          }
        }
      }
    })

    if (!tenant) {
      return { success: false, error: 'Maktab topilmadi' }
    }

    // Prevent deletion if has data
    if (tenant._count.students > 0 || tenant._count.teachers > 0 || tenant._count.users > 0) {
      return { 
        success: false, 
        error: 'Maktabda ma\'lumotlar mavjud. Avval barcha ma\'lumotlarni o\'chiring yoki statusni BLOCKED qiling.' 
      }
    }

    // Safe to delete
    await db.tenant.delete({
      where: { id: tenantId }
    })

    revalidatePath('/super-admin/tenants')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete tenant error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteTenantWithData(tenantId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true }
    })

    if (!tenant) {
      return { success: false, error: 'Maktab topilmadi' }
    }

    // Delete all related data in correct order (respecting foreign keys)
    await db.$transaction(async (tx) => {
      // 1. Delete activity logs
      await tx.activityLog.deleteMany({ where: { tenantId } })
      
      // 2. Delete notifications
      await tx.notification.deleteMany({ where: { tenantId } })
      
      // 3. Delete messages
      await tx.message.deleteMany({ where: { tenantId } })
      
      // 4. Delete announcements
      await tx.announcement.deleteMany({ where: { tenantId } })
      
      // 5. Delete materials
      await tx.material.deleteMany({ where: { tenantId } })
      
      // 6. Delete assignments and submissions
      await tx.assignmentSubmission.deleteMany({ 
        where: { assignment: { tenantId } } 
      })
      await tx.assignment.deleteMany({ where: { tenantId } })
      
      // 7. Delete grades
      await tx.grade.deleteMany({ where: { tenantId } })
      
      // 8. Delete attendances
      await tx.attendance.deleteMany({ where: { tenantId } })
      
      // 9. Delete schedules
      await tx.schedule.deleteMany({ where: { tenantId } })
      
      // 10. Delete payments and payment plans (transactions cascade from payment)
      await tx.payment.deleteMany({ where: { tenantId } })
      await tx.paymentPlan.deleteMany({ where: { tenantId } })
      
      // 11. Delete subscription payments
      await tx.subscriptionPayment.deleteMany({ where: { tenantId } })
      
      // 12. Delete student-parent relationships
      await tx.studentParent.deleteMany({ 
        where: { student: { tenantId } } 
      })
      
      // 13. Delete parents
      await tx.parent.deleteMany({ where: { tenantId } })
      
      // 14. Delete contracts (uploadedById references users)
      await tx.contract.deleteMany({ where: { tenantId } })

      // 15. Delete salary payments
      await tx.salaryPayment.deleteMany({ where: { tenantId } })

      // 16. Delete expenses and categories
      await tx.expense.deleteMany({ where: { tenantId } })
      await tx.expenseCategory.deleteMany({ where: { tenantId } })

      // 17. Delete kitchen expenses and categories
      await tx.kitchenExpense.deleteMany({ where: { tenantId } })
      await tx.kitchenExpenseCategory.deleteMany({ where: { tenantId } })
      await tx.meal.deleteMany({ where: { tenantId } })

      // 18. Delete dormitory assignments
      await tx.dormitoryAssignment.deleteMany({ where: { tenantId } })

      // 19. Delete dormitory beds
      await tx.dormitoryBed.deleteMany({ where: { tenantId } })

      // 20. Delete dormitory rooms
      await tx.dormitoryRoom.deleteMany({ where: { tenantId } })

      // 21. Delete dormitory buildings
      await tx.dormitoryBuilding.deleteMany({ where: { tenantId } })

      // 22. Delete contacts
      await tx.contactPerson.deleteMany({ where: { tenantId } })

      // 23. Delete students
      await tx.student.deleteMany({ where: { tenantId } })
      
      // 24. Delete staff
      await tx.staff.deleteMany({ where: { tenantId } })

      // 25. Delete teachers
      await tx.teacher.deleteMany({ where: { tenantId } })

      // 26. Delete cooks
      await tx.cook.deleteMany({ where: { tenantId } })
      
      // 27. Delete subjects
      await tx.subject.deleteMany({ where: { tenantId } })
      
      // 28. Delete groups and classes
      await tx.groupSchedule.deleteMany({ where: { tenantId } })
      await tx.groupSubject.deleteMany({ where: { group: { tenantId } } })
      await tx.group.deleteMany({ where: { tenantId } })
      await tx.classSubject.deleteMany({ where: { class: { tenantId } } })
      await tx.class.deleteMany({ where: { tenantId } })
      
      // 29. Delete permissions and users
      await tx.permission.deleteMany({ where: { user: { tenantId } } })
      await tx.user.deleteMany({ where: { tenantId } })
      
      // 30. Finally, delete tenant
      await tx.tenant.delete({ where: { id: tenantId } })
    })

    revalidatePath('/super-admin/tenants')
    
    return { 
      success: true, 
      message: `${tenant.name} va barcha ma'lumotlar muvaffaqiyatli o'chirildi` 
    }
  } catch (error: any) {
    console.error('Delete tenant with data error:', error)
    return { success: false, error: error.message || 'O\'chirishda xatolik yuz berdi' }
  }
}

