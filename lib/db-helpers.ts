/**
 * Database Query Helpers
 * Optimized queries with caching and performance tracking
 */

import { db } from './db'
import { logger } from './logger'

/**
 * Execute query with performance tracking
 */
export async function executeQuery<T>(
  label: string,
  query: () => Promise<T>,
  tenantId?: string
): Promise<T> {
  const start = Date.now()
  try {
    const result = await query()
    const duration = Date.now() - start
    
    logger.dbQuery(label, duration, tenantId)
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`Query failed: ${label}`, error, {
      tenantId,
      duration,
      action: 'DB_QUERY_ERROR',
    })
    throw error
  }
}

/**
 * Optimized student query with selective fields
 */
export async function getStudentWithDetails(studentId: string, tenantId: string) {
  return executeQuery(
    'getStudentWithDetails',
    async () => {
      return db.student.findFirst({
        where: { id: studentId, tenantId },
        select: {
          id: true,
          studentCode: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          status: true,
          enrollmentDate: true,
          monthlyTuitionFee: true,
          paymentDueDay: true,
          trialEnabled: true,
          trialStartDate: true,
          trialEndDate: true,
          trialDays: true,
          medicalInfo: true,
          documents: true,
          classId: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatar: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              classTeacher: {
                select: {
                  user: {
                    select: {
                      fullName: true,
                    }
                  }
                }
              }
            }
          },
          parents: {
            select: {
              hasAccess: true,
              parent: {
                select: {
                  id: true,
                  guardianType: true,
                  customRelationship: true,
                  occupation: true,
                  emergencyContact: true,
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phone: true,
                    }
                  }
                }
              }
            }
          },
          dormitoryAssignment: {
            select: {
              id: true,
              status: true,
              monthlyFee: true,
              checkInDate: true,
              room: {
                select: {
                  roomNumber: true,
                  building: {
                    select: {
                      name: true,
                    }
                  }
                }
              },
              bed: {
                select: {
                  bedNumber: true,
                }
              }
            }
          },
          // Counts instead of full arrays
          _count: {
            select: {
              attendances: true,
              grades: true,
              payments: true,
            }
          }
        }
      })
    },
    tenantId
  )
}

/**
 * Optimized payment query with monthly breakdown
 */
export async function getStudentMonthlyPayments(
  studentId: string,
  tenantId: string,
  year: number,
  month: number
) {
  return executeQuery(
    'getStudentMonthlyPayments',
    async () => {
      return db.payment.findMany({
        where: {
          studentId,
          tenantId,
          paymentType: 'TUITION',
          paymentMonth: month,
          paymentYear: year,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          dueDate: true,
          paidDate: true,
          invoiceNumber: true,
          paymentMethod: true,
        },
        orderBy: {
          createdAt: 'asc',
        }
      })
    },
    tenantId
  )
}

/**
 * Bulk fetch students with pagination and filters
 */
export async function getStudentsList(
  tenantId: string,
  options: {
    page?: number
    pageSize?: number
    status?: string
    classId?: string
    search?: string
  } = {}
) {
  const {
    page = 1,
    pageSize = 25,
    status,
    classId,
    search,
  } = options

  const skip = (page - 1) * pageSize

  const where: any = { tenantId }

  if (status) where.status = status
  if (classId) where.classId = classId
  if (search) {
    where.OR = [
      { studentCode: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
    ]
  }

  return executeQuery(
    'getStudentsList',
    async () => {
      const [students, total] = await Promise.all([
        db.student.findMany({
          where,
          select: {
            id: true,
            studentCode: true,
            status: true,
            monthlyTuitionFee: true,
            trialEnabled: true,
            user: {
              select: {
                fullName: true,
                avatar: true,
              }
            },
            class: {
              select: {
                name: true,
              }
            },
            _count: {
              select: {
                payments: {
                  where: { status: 'PENDING' }
                }
              }
            }
          },
          orderBy: { studentCode: 'asc' },
          skip,
          take: pageSize,
        }),
        db.student.count({ where }),
      ])

      return {
        students,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        }
      }
    },
    tenantId
  )
}

/**
 * Get dashboard statistics (optimized with parallel queries)
 */
export async function getDashboardStats(tenantId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  return executeQuery(
    'getDashboardStats',
    async () => {
      const [
        totalStudents,
        totalTeachers,
        activeStudents,
        trialStudents,
        thisMonthRevenue,
        thisMonthExpenses,
        pendingPaymentsCount,
        completedPaymentsCount,
        overduePaymentsCount,
      ] = await Promise.all([
        // Students
        db.student.count({ where: { tenantId } }),
        db.teacher.count({ where: { tenantId } }),
        db.student.count({ where: { tenantId, status: 'ACTIVE' } }),
        db.student.count({ where: { tenantId, trialEnabled: true, status: 'ACTIVE' } }),
        
        // Payments
        db.payment.aggregate({
          where: {
            tenantId,
            status: 'COMPLETED',
            paidDate: { gte: thisMonthStart }
          },
          _sum: { amount: true },
        }),
        
        // Expenses
        db.expense.aggregate({
          where: {
            tenantId,
            date: { gte: thisMonthStart }
          },
          _sum: { amount: true },
        }),

        // Payment counts
        db.payment.count({
          where: {
            tenantId,
            status: 'PENDING',
            paymentMonth: today.getMonth() + 1,
            paymentYear: today.getFullYear(),
          }
        }),
        db.payment.count({
          where: {
            tenantId,
            status: 'COMPLETED',
            paymentMonth: today.getMonth() + 1,
            paymentYear: today.getFullYear(),
          }
        }),
        db.payment.count({
          where: {
            tenantId,
            status: 'PENDING',
            dueDate: { lt: today },
          }
        }),
      ])

      return {
        students: {
          total: totalStudents,
          active: activeStudents,
          trial: trialStudents,
        },
        teachers: {
          total: totalTeachers,
        },
        payments: {
          thisMonthRevenue: Number(thisMonthRevenue._sum.amount || 0),
          thisMonthExpenses: Number(thisMonthExpenses._sum.amount || 0),
          thisMonthBalance: Number(thisMonthRevenue._sum.amount || 0) - Number(thisMonthExpenses._sum.amount || 0),
          pending: pendingPaymentsCount,
          completed: completedPaymentsCount,
          overdue: overduePaymentsCount,
        }
      }
    },
    tenantId
  )
}

