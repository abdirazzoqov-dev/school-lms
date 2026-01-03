import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, requireAdmin } from '@/lib/api-helpers'
import { logger, withTiming } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // ✅ Validate admin session
    const validation = await requireAdmin()
    if (!validation.success) {
      return validation.response
    }

    const { tenantId, userId } = validation

    // ✅ Track performance
    const students = await withTiming('fetch_students', async () => {
      return db.student.findMany({
        where: {
          tenantId: tenantId!, // Admin always has tenantId (except SUPER_ADMIN can access all)
        },
        select: {
          id: true,
          studentCode: true,
          dateOfBirth: true,
          gender: true,
          status: true,
          enrollmentDate: true,
          monthlyTuitionFee: true,
          trialEnabled: true,
          trialEndDate: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
            }
          },
          // Optimize: Only count, not fetch all
          _count: {
            select: {
              payments: true,
              grades: true,
              attendances: true,
            }
          }
        },
        orderBy: {
          studentCode: 'asc'
        }
      })
    })

    logger.info(`Fetched ${students.length} students`, {
      userId,
      tenantId: tenantId!,
      action: 'FETCH_STUDENTS',
    })

    return ApiResponse.success({ students })
  } catch (error) {
    logger.error('Failed to fetch students', error, {
      action: 'FETCH_STUDENTS',
    })
    return ApiResponse.serverError()
  }
}

