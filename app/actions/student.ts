'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { studentSchema, StudentFormData } from '@/lib/validations/student'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'
import { canAddStudent } from '@/lib/tenant'
import { handleError } from '@/lib/error-handler'

// Helper function to update building cache
async function updateBuildingCache(buildingId: string) {
  const rooms = await db.dormitoryRoom.findMany({
    where: { buildingId },
    select: {
      capacity: true,
      occupiedBeds: true,
    },
  })

  const totalRooms = rooms.length
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)

  await db.dormitoryBuilding.update({
    where: { id: buildingId },
    data: {
      totalRooms,
      totalCapacity,
      occupiedBeds,
    },
  })
}
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

    // ✅ FIX: Generate and check student email BEFORE creating anything
    let studentEmail = ''
    
    if (validatedData.email && validatedData.email.trim() !== '') {
      // User provided email - must be unique
      studentEmail = validatedData.email.trim().toLowerCase()
      
      const existingUser = await db.user.findUnique({
        where: { email: studentEmail }
      })

      if (existingUser) {
        return { success: false, error: `Bu email (${studentEmail}) allaqachon ishlatilgan. Boshqa email kiriting yoki bo'sh qoldiring.` }
      }
    } else {
      // Generate auto email based on student code
      studentEmail = `${validatedData.studentCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.local`
      
      // Check if generated email exists
      const existingUser = await db.user.findUnique({
        where: { email: studentEmail }
      })

      if (existingUser) {
        // If generated email exists, add random suffix
        const randomSuffix = generateRandomString(4)
        studentEmail = `${validatedData.studentCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomSuffix}@student.local`
      }
    }

    // ✅ USE TRANSACTION - If anything fails, everything rolls back
    const result = await db.$transaction(async (tx) => {
      // Process guardians (multiple parents/guardians)
      const guardianResults = []
      const defaultPassword = await hashPassword('Parent123!') // Default password
    
    for (const guardianData of validatedData.guardians) {
      // Normalize phone number (remove all non-digit characters)
      const normalizedPhone = guardianData.phone.replace(/[^0-9]/g, '')
      
      // ✅ FIX: More accurate phone lookup - check multiple formats
      const allUsers = await tx.user.findMany({
        where: {
          tenantId,
          role: 'PARENT',
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          parent: {
            include: {
              user: true
            }
          }
        }
      })

      // Find guardian by normalized phone
      const matchingUser = allUsers.find(u => {
        if (!u.phone) return false
        const userNormalizedPhone = u.phone.replace(/[^0-9]/g, '')
        return userNormalizedPhone === normalizedPhone
      })

      let guardian = matchingUser?.parent || null

      // If guardian doesn't exist, create new one
      if (!guardian) {
        // ✅ FIX: Generate truly unique email with random string
        const phoneDigits = normalizedPhone
        const randomStr = generateRandomString(8)
        const guardianEmail = `parent_${phoneDigits}_${randomStr}@temp.local`

        // ✅ DOUBLE CHECK: Ensure email doesn't exist
        const emailExists = await tx.user.findUnique({
          where: { email: guardianEmail }
        })
        
        if (emailExists) {
          // Fallback: use even more unique email
          const timestamp = Date.now()
          const fallbackEmail = `parent_${phoneDigits}_${timestamp}_${randomStr}@temp.local`
          
          // Create guardian user account
          const guardianUser = await tx.user.create({
            data: {
              email: fallbackEmail,
              fullName: guardianData.fullName,
              phone: guardianData.phone,
              passwordHash: defaultPassword,
              role: 'PARENT',
              tenantId,
              isActive: true,
            }
          })

          // Create parent/guardian record
          guardian = await tx.parent.create({
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
        } else {
          // Create guardian user account
          const guardianUser = await tx.user.create({
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
          guardian = await tx.parent.create({
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
      }

      guardianResults.push({
        guardian,
        hasAccess: guardianData.hasAccess
      })
    }

      // Create student user account (always create to save fullName)
      const studentPassword = await hashPassword('Student123!')
      
      const studentUser = await tx.user.create({
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
      const student = await tx.student.create({
        data: {
          tenantId,
          userId: studentUser?.id || null,
          studentCode: validatedData.studentCode,
          dateOfBirth: new Date(validatedData.dateOfBirth),
          gender: validatedData.gender,
          classId: validatedData.classId || null,
          groupId: validatedData.groupId || null,
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
        await tx.studentParent.create({
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
        
        await tx.payment.create({
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
        
        await tx.payment.create({
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
        const bed = await tx.dormitoryBed.findFirst({
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
          throw new Error('Tanlangan joy band yoki mavjud emas')
        }

        // Create dormitory assignment
        await tx.dormitoryAssignment.create({
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
        await tx.dormitoryBed.update({
          where: { id: bed.id },
          data: { isOccupied: true },
        })

        // Update room occupied count
        await tx.dormitoryRoom.update({
          where: { id: bed.roomId },
          data: { occupiedBeds: { increment: 1 } },
        })

        // Update building cache
        const room = bed.room
        const buildingId = room.buildingId
        
        const rooms = await tx.dormitoryRoom.findMany({
          where: { buildingId },
          select: {
            capacity: true,
            occupiedBeds: true,
          },
        })

        const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
        const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)

        await tx.dormitoryBuilding.update({
          where: { id: buildingId },
          data: {
            totalCapacity,
            occupiedBeds,
          },
        })

        // ✅ Create dormitory payment for current month (like tuition)
        if (validatedData.dormitoryMonthlyFee && validatedData.dormitoryMonthlyFee > 0) {
          const now = new Date()
          const currentMonth = now.getMonth() + 1
          const currentYear = now.getFullYear()
          
          await tx.payment.create({
            data: {
              tenantId,
              studentId: student.id,
              parentId: primaryGuardian?.guardian.id || null,
              amount: validatedData.dormitoryMonthlyFee,
              paidAmount: 0,
              remainingAmount: validatedData.dormitoryMonthlyFee,
              paymentType: 'DORMITORY',
              paymentMethod: 'CASH',
              status: 'PENDING',
              paymentMonth: currentMonth,
              paymentYear: currentYear,
              invoiceNumber: `INV-DORM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
              dueDate: new Date(currentYear, currentMonth, 10),
              notes: `Oylik yotoqxona to'lovi`,
            }
          })
        }
      }

      // ✅ Return student and primary guardian info from transaction
      return {
        student,
        primaryGuardian
      }
    }) // End of transaction

    // ✅ Revalidate multiple related paths
    revalidateMultiplePaths([...REVALIDATION_PATHS.STUDENT_CHANGED], revalidatePath)
    revalidatePath('/admin/students')
    revalidatePath('/admin/dormitory')
    revalidatePath('/admin/dormitory/buildings')
    revalidatePath('/admin/dormitory/rooms')
    
    logger.info('Student created successfully', {
      userId: session.user.id,
      tenantId,
      action: 'CREATE_STUDENT',
      resourceId: result.student.id,
    })
    
    return { 
      success: true,
      userId: result.student.userId ?? null,   // for avatar upload
      student: result.student,
      guardianCredentials: result.primaryGuardian ? {
        phone: result.primaryGuardian.guardian.user.phone,
        password: 'Parent123!',
        fullName: result.primaryGuardian.guardian.user.fullName
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

    // ✅ Debug logging
    logger.info('=== UPDATE STUDENT START ===', {
      userId: session.user.id,
      studentId,
      tenantId
    })
    logger.info(`Received data: monthlyTuitionFee=${data.monthlyTuitionFee}, dormitoryMonthlyFee=${data.dormitoryMonthlyFee}`, {
      studentId
    })

    // Get existing student data
    const existingStudent = await db.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: { user: true }
            }
          }
        }
      }
    })

    if (!existingStudent) {
      return { success: false, error: 'O\'quvchi topilmadi' }
    }

    logger.info(`Existing student fees: monthlyTuitionFee=${Number(existingStudent.monthlyTuitionFee)}`, {
      studentId
    })

    // Check if student code is being changed and is unique
    if (data.studentCode && data.studentCode !== existingStudent.studentCode) {
      const codeExists = await db.student.findFirst({
        where: {
          tenantId,
          studentCode: data.studentCode,
          NOT: { id: studentId }
        }
      })

      if (codeExists) {
        return { success: false, error: 'Bu o\'quvchi kodi allaqachon ishlatilgan' }
      }
    }

    // Update student user (fullName, email)
    if (existingStudent.userId && (data.fullName || data.email)) {
      const updateUserData: any = {}
      
      if (data.fullName) {
        updateUserData.fullName = data.fullName
      }
      
      if (data.email && data.email !== existingStudent.user?.email) {
        // Check if email already exists
        const emailExists = await db.user.findFirst({
          where: {
            email: data.email,
            NOT: { id: existingStudent.userId }
          }
        })
        
        if (emailExists) {
          return { success: false, error: 'Bu email allaqachon ishlatilgan' }
        }
        
        updateUserData.email = data.email
      }

      if (Object.keys(updateUserData).length > 0) {
        await db.user.update({
          where: { id: existingStudent.userId },
          data: updateUserData
        })
      }
    }

    // Calculate trial period dates if changed
    let trialStartDate = existingStudent.trialStartDate
    let trialEndDate = existingStudent.trialEndDate
    
    if (data.trialEnabled !== undefined) {
      if (data.trialEnabled && data.trialDays) {
        trialStartDate = trialStartDate || new Date()
        trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + data.trialDays)
      } else {
        trialStartDate = null
        trialEndDate = null
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
        groupId: data.groupId || null,
        address: data.address || null,
        // Trial period
        trialEnabled: data.trialEnabled !== undefined ? data.trialEnabled : undefined,
        trialStartDate: data.trialEnabled !== undefined ? trialStartDate : undefined,
        trialEndDate: data.trialEnabled !== undefined ? trialEndDate : undefined,
        trialDays: data.trialDays !== undefined ? data.trialDays : undefined,
        // Payment info
        monthlyTuitionFee: data.monthlyTuitionFee !== undefined ? data.monthlyTuitionFee : undefined,
        paymentDueDay: data.paymentDueDay !== undefined ? data.paymentDueDay : undefined,
      }
    })

    // Update guardians if provided
    if (data.guardians && data.guardians.length > 0) {
      const defaultPassword = await hashPassword('Parent123!')
      const guardianResults = []

      // Process each guardian
      for (const guardianData of data.guardians) {
        let guardian = null

        // Check if this guardian already exists (by phone or parentId)
        const existingParentRelation = existingStudent.parents.find(
          (sp: any) => sp.parent.user?.phone === guardianData.phone
        )

        if (existingParentRelation) {
          // Update existing guardian
          guardian = existingParentRelation.parent
          
          // Update guardian user
          await db.user.update({
            where: { id: guardian.userId },
            data: {
              fullName: guardianData.fullName,
              phone: guardianData.phone,
            }
          })

          // Update parent record
          await db.parent.update({
            where: { id: guardian.id },
            data: {
              guardianType: guardianData.guardianType,
              customRelationship: guardianData.customRelationship || null,
              occupation: guardianData.occupation || null,
              workAddress: guardianData.workAddress || null,
            }
          })

          // Update access
          await db.studentParent.updateMany({
            where: {
              studentId,
              parentId: guardian.id
            },
            data: {
              hasAccess: guardianData.hasAccess
            }
          })
        } else {
          // Normalize phone number
          const normalizedPhone = guardianData.phone.replace(/[^0-9]/g, '')
          
          // Check if guardian exists in system by phone
          guardian = await db.parent.findFirst({
            where: {
              tenantId,
              user: {
                phone: {
                  contains: normalizedPhone
                }
              }
            },
            include: {
              user: true
            }
          })

          // If not, create new guardian
          if (!guardian) {
            const phoneDigits = normalizedPhone
            const timestamp = Date.now().toString().slice(-6)
            const guardianEmail = `parent_${phoneDigits}_${timestamp}@temp.local`

            const guardianUser = await db.user.create({
              data: {
                email: guardianEmail,
                fullName: guardianData.fullName,
                phone: guardianData.phone,
                passwordHash: defaultPassword,
                role: 'PARENT',
                tenantId,
                isActive: true,
              }
            })

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

          // Link to student
          await db.studentParent.create({
            data: {
              studentId,
              parentId: guardian.id,
              hasAccess: guardianData.hasAccess
            }
          })
        }

        guardianResults.push({
          guardian,
          hasAccess: guardianData.hasAccess
        })
      }

      // Remove guardians that are no longer in the list
      const currentGuardianPhones = data.guardians.map(g => g.phone)
      const guardiansToRemove = existingStudent.parents.filter(
        (sp: any) => !currentGuardianPhones.includes(sp.parent.user?.phone)
      )

      for (const relation of guardiansToRemove) {
        await db.studentParent.delete({
          where: {
            studentId_parentId: {
              studentId,
              parentId: relation.parentId
            }
          }
        })
      }
    }

    // Track buildings that need cache update
    const buildingsToUpdate = new Set<string>()

    // ✅ SAVE OLD FEES for payment update comparison (BEFORE assignment update)
    let oldDormitoryFee: number | null = null
    const existingAssignmentBefore = await db.dormitoryAssignment.findUnique({
      where: { studentId },
      select: { monthlyFee: true }
    })
    if (existingAssignmentBefore) {
      oldDormitoryFee = Number(existingAssignmentBefore.monthlyFee)
    }

    // Handle dormitory updates
    if (data.dormitoryBedId !== undefined) {
      // Check existing dormitory assignment
      const existingAssignment = await db.dormitoryAssignment.findUnique({
        where: { studentId },
        include: {
          room: {
            select: {
              buildingId: true,
            }
          }
        }
      })

      if (data.dormitoryBedId) {
        // Assign or update dormitory
        const bed = await db.dormitoryBed.findFirst({
          where: {
            id: data.dormitoryBedId,
            tenantId,
            isActive: true,
          },
          include: {
            room: {
              select: {
                id: true,
                buildingId: true,
              }
            },
          },
        })

        if (!bed) {
          return { success: false, error: 'Tanlangan joy mavjud emas' }
        }

        // Check if bed is occupied by another student
        if (bed.isOccupied && bed.id !== existingAssignment?.bedId) {
          return { success: false, error: 'Tanlangan joy band' }
        }

        if (existingAssignment) {
          // Track old building for cache update
          if (existingAssignment.room?.buildingId) {
            buildingsToUpdate.add(existingAssignment.room.buildingId)
          }

          // Free old bed if different
          if (existingAssignment.bedId !== data.dormitoryBedId) {
            await db.dormitoryBed.update({
              where: { id: existingAssignment.bedId },
              data: { isOccupied: false }
            })
            await db.dormitoryRoom.update({
              where: { id: existingAssignment.roomId },
              data: { occupiedBeds: { decrement: 1 } }
            })
          }

          // Track new building for cache update
          if (bed.room.buildingId) {
            buildingsToUpdate.add(bed.room.buildingId)
          }

          // Update assignment
          await db.dormitoryAssignment.update({
            where: { studentId },
            data: {
              roomId: bed.roomId,
              bedId: bed.id,
              monthlyFee: data.dormitoryMonthlyFee || 0,
            }
          })

          // Occupy new bed if different
          if (existingAssignment.bedId !== data.dormitoryBedId) {
            await db.dormitoryBed.update({
              where: { id: bed.id },
              data: { isOccupied: true }
            })
            await db.dormitoryRoom.update({
              where: { id: bed.roomId },
              data: { occupiedBeds: { increment: 1 } }
            })
          }
        } else {
          // Track new building for cache update
          if (bed.room.buildingId) {
            buildingsToUpdate.add(bed.room.buildingId)
          }

          // Create new assignment
          await db.dormitoryAssignment.create({
            data: {
              tenantId,
              studentId,
              roomId: bed.room.id,
              bedId: bed.id,
              monthlyFee: data.dormitoryMonthlyFee || 0,
              status: 'ACTIVE',
              assignedById: session.user.id,
            }
          })

          await db.dormitoryBed.update({
            where: { id: bed.id },
            data: { isOccupied: true }
          })

          await db.dormitoryRoom.update({
            where: { id: bed.room.id },
            data: { occupiedBeds: { increment: 1 } }
          })

          // ✅ Create dormitory payment for current month (NEW assignment)
          if (data.dormitoryMonthlyFee && data.dormitoryMonthlyFee > 0) {
            const now = new Date()
            const currentMonth = now.getMonth() + 1
            const currentYear = now.getFullYear()
            
            // Check if payment already exists for this month
            const existingPayment = await db.payment.findFirst({
              where: {
                tenantId,
                studentId,
                paymentType: 'DORMITORY',
                paymentMonth: currentMonth,
                paymentYear: currentYear,
              }
            })

            if (!existingPayment) {
              const parentRelation = await db.studentParent.findFirst({
                where: { studentId, hasAccess: true },
                select: { parentId: true }
              })

              await db.payment.create({
                data: {
                  tenantId,
                  studentId,
                  parentId: parentRelation?.parentId || null,
                  amount: data.dormitoryMonthlyFee,
                  paidAmount: 0,
                  remainingAmount: data.dormitoryMonthlyFee,
                  paymentType: 'DORMITORY',
                  paymentMethod: 'CASH',
                  status: 'PENDING',
                  paymentMonth: currentMonth,
                  paymentYear: currentYear,
                  invoiceNumber: `INV-DORM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
                  dueDate: new Date(currentYear, currentMonth, 10),
                  notes: `Oylik yotoqxona to'lovi`,
                }
              })
            }
          }
        }
      } else if (existingAssignment) {
        // Track old building for cache update
        if (existingAssignment.room?.buildingId) {
          buildingsToUpdate.add(existingAssignment.room.buildingId)
        }

        // Remove dormitory assignment
        await db.dormitoryBed.update({
          where: { id: existingAssignment.bedId },
          data: { isOccupied: false }
        })

        await db.dormitoryRoom.update({
          where: { id: existingAssignment.roomId },
          data: { occupiedBeds: { decrement: 1 } }
        })

        await db.dormitoryAssignment.delete({
          where: { studentId }
        })
      }
    }

    // Update building cache for all affected buildings
    for (const buildingId of buildingsToUpdate) {
      await updateBuildingCache(buildingId)
    }

    // ✅ UPDATE PENDING/PARTIALLY_PAID PAYMENTS when fees change
    
    logger.info('=== CHECKING PAYMENT UPDATES ===', { studentId })
    logger.info(`data.monthlyTuitionFee: ${data.monthlyTuitionFee}, existing: ${Number(existingStudent.monthlyTuitionFee)}`, { studentId })
    logger.info(`data.dormitoryMonthlyFee: ${data.dormitoryMonthlyFee}, oldDormitoryFee: ${oldDormitoryFee}`, { studentId })
    
    // 1. Update TUITION payments if monthlyTuitionFee changed
    if (data.monthlyTuitionFee !== undefined) {
      const oldTuitionFee = Number(existingStudent.monthlyTuitionFee)
      const newTuitionFee = data.monthlyTuitionFee
      
      logger.info(`Tuition comparison: ${newTuitionFee} !== ${oldTuitionFee} = ${newTuitionFee !== oldTuitionFee}`, { studentId })
      
      if (newTuitionFee !== oldTuitionFee) {
        logger.info(`Updating tuition payments: ${oldTuitionFee} -> ${newTuitionFee}`, {
          studentId
        })
        
        // ✅ CRITICAL: Faqat hali to'lov qilinmagan (paidAmount = 0) PENDING paymentlarni yangilash
        const pendingTuitionPayments = await db.payment.findMany({
          where: {
            tenantId,
            studentId,
            paymentType: 'TUITION',
            status: 'PENDING', // ✅ Faqat PENDING (PARTIALLY_PAID emas!)
            paidAmount: 0, // ✅ Hali hech narsa to'lanmagan
            remainingAmount: { gt: 0 }
          }
        })

        logger.info(`Found ${pendingTuitionPayments.length} pending tuition payments to update`)

        for (const payment of pendingTuitionPayments) {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              amount: newTuitionFee,
              remainingAmount: newTuitionFee, // ✅ paidAmount = 0 bo'lgani uchun
              tuitionFeeAtPayment: newTuitionFee // ✅ Update snapshot for future PENDING payments
            }
          })
          
          logger.info(`Updated tuition payment ${payment.id}: ${Number(payment.amount)} -> ${newTuitionFee}`, {
            studentId
          })
        }
      } else {
        logger.info('Tuition fee unchanged, skipping update', { studentId })
      }
    } else {
      logger.info('data.monthlyTuitionFee is undefined, skipping tuition update', { studentId })
    }

    // 2. Update DORMITORY payments if dormitoryMonthlyFee changed
    if (data.dormitoryMonthlyFee !== undefined) {
      logger.info(`Dormitory comparison: ${data.dormitoryMonthlyFee} !== ${oldDormitoryFee} = ${data.dormitoryMonthlyFee !== oldDormitoryFee}`, { studentId })
      
      if (oldDormitoryFee !== null && data.dormitoryMonthlyFee !== oldDormitoryFee) {
        logger.info(`Updating dormitory payments: ${oldDormitoryFee} -> ${data.dormitoryMonthlyFee}`, {
          studentId
        })
        
        const pendingDormPayments = await db.payment.findMany({
          where: {
            tenantId,
            studentId,
            paymentType: 'DORMITORY',
            status: { in: ['PENDING', 'PARTIALLY_PAID'] },
            remainingAmount: { gt: 0 }
          }
        })

        logger.info(`Found ${pendingDormPayments.length} pending dormitory payments to update`)

        for (const payment of pendingDormPayments) {
          const newRemainingAmount = data.dormitoryMonthlyFee - Number(payment.paidAmount)
          
          await db.payment.update({
            where: { id: payment.id },
            data: {
              amount: data.dormitoryMonthlyFee,
              remainingAmount: Math.max(0, newRemainingAmount),
              status: newRemainingAmount <= 0 ? 'COMPLETED' : (Number(payment.paidAmount) > 0 ? 'PARTIALLY_PAID' : 'PENDING')
            }
          })
          
          logger.info(`Updated dormitory payment ${payment.id}: ${Number(payment.amount)} -> ${data.dormitoryMonthlyFee}, remaining: ${newRemainingAmount}`, {
            studentId
          })
        }
      } else if (oldDormitoryFee === null) {
        logger.info('No existing dormitory assignment, skipping dormitory payment update', { studentId })
      } else {
        logger.info('Dormitory fee unchanged, skipping update', { studentId })
      }
    } else {
      logger.info('data.dormitoryMonthlyFee is undefined, skipping dormitory update', { studentId })
    }

    // ✅ Revalidate multiple related paths
    revalidateMultiplePaths([...REVALIDATION_PATHS.STUDENT_CHANGED], revalidatePath)
    revalidatePath('/admin/students')
    revalidatePath(`/admin/students/${studentId}`)
    revalidatePath('/admin/payments')
    revalidatePath('/parent/payments')
    revalidatePath('/admin/dormitory')
    revalidatePath('/admin/dormitory/buildings')
    revalidatePath('/admin/dormitory/rooms')
    
    logger.info('Student updated successfully', {
      userId: session.user.id,
      tenantId,
      action: 'UPDATE_STUDENT',
      resourceId: studentId,
    })
    
    return { success: true, student }
  } catch (error: any) {
    console.error('Update student error:', error)
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
      throw new Error('Ruxsat berilmagan')
    }

    const tenantId = session.user.tenantId!

    // Get all students with their payment info
    const students = await db.student.findMany({
      where: { 
        id: { in: studentIds },
        tenantId 
      },
      include: {
        user: true,
        payments: {
          where: {
            status: { in: ['PENDING', 'PARTIALLY_PAID', 'FAILED'] },
            remainingAmount: { gt: 0 }
          }
        },
        _count: {
          select: {
            grades: true,
            attendances: true,
            payments: true,
          }
        }
      }
    })

    if (students.length === 0) {
      throw new Error('O\'quvchilar topilmadi')
    }

    // Check for unpaid payments
    const studentsWithUnpaidPayments = students.filter(s => s.payments.length > 0)
    
    if (studentsWithUnpaidPayments.length > 0) {
      const studentNames = studentsWithUnpaidPayments
        .map(s => s.user?.fullName || 'N/A')
        .slice(0, 3)
        .join(', ')
      
      const moreCount = studentsWithUnpaidPayments.length - 3
      const namesText = moreCount > 0 
        ? `${studentNames} va yana ${moreCount} ta` 
        : studentNames

      throw new Error(
        `⚠️ ${studentsWithUnpaidPayments.length} ta o'quvchida to'lanmagan to'lovlar mavjud!\n\n` +
        `O'quvchilar: ${namesText}\n\n` +
        `Avval barcha to'lovlarni to'lash yoki bekor qilish kerak.`
      )
    }

    // All students are safe to delete - proceed with deletion
    let deletedCount = 0
    const errors: string[] = []

    for (const student of students) {
      try {
        // Delete in transaction for each student
        await db.$transaction(async (tx) => {
          // 1. Delete grades
          if (student._count.grades > 0) {
            await tx.grade.deleteMany({
              where: { studentId: student.id }
            })
          }

          // 2. Delete attendances
          if (student._count.attendances > 0) {
            await tx.attendance.deleteMany({
              where: { studentId: student.id }
            })
          }

          // 3. Delete payments (all paid/cancelled)
          if (student._count.payments > 0) {
            await tx.payment.deleteMany({
              where: { studentId: student.id }
            })
          }

          // 4. Delete student-parent relations
          await tx.studentParent.deleteMany({
            where: { studentId: student.id }
          })

          // 5. Free dormitory bed if occupied
          const dormitoryAssignment = await tx.dormitoryAssignment.findUnique({
            where: { studentId: student.id },
            include: {
              room: {
                select: {
                  buildingId: true
                }
              }
            }
          })
          
          if (dormitoryAssignment) {
            await tx.dormitoryBed.update({
              where: { id: dormitoryAssignment.bedId },
              data: { isOccupied: false }
            })
            
            await tx.dormitoryRoom.update({
              where: { id: dormitoryAssignment.roomId },
              data: { occupiedBeds: { decrement: 1 } }
            })
            
            await tx.dormitoryAssignment.delete({
              where: { studentId: student.id }
            })

            // Update building cache
            if (dormitoryAssignment.room?.buildingId) {
              const rooms = await tx.dormitoryRoom.findMany({
                where: { buildingId: dormitoryAssignment.room.buildingId },
                select: {
                  capacity: true,
                  occupiedBeds: true,
                },
              })

              const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
              const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)

              await tx.dormitoryBuilding.update({
                where: { id: dormitoryAssignment.room.buildingId },
                data: {
                  totalCapacity,
                  occupiedBeds,
                },
              })
            }
          }

          // 6. Delete student record
          await tx.student.delete({
            where: { 
              id: student.id,
              tenantId,
            }
          })

          // 7. Delete associated user account
          if (student.userId) {
            await tx.user.delete({
              where: { id: student.userId }
            })
          }
        })

        deletedCount++
      } catch (err: any) {
        errors.push(`${student.user?.fullName || 'N/A'}: ${err.message}`)
      }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/dormitory')
    
    if (errors.length > 0) {
      throw new Error(
        `${deletedCount} ta o'quvchi o'chirildi, ${errors.length} ta xato:\n` +
        errors.join('\n')
      )
    }
    
    return { 
      success: true, 
      message: `${deletedCount} ta o'quvchi muvaffaqiyatli o'chirildi`
    }
  } catch (error: any) {
    console.error('Bulk delete error:', error)
    throw error
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
