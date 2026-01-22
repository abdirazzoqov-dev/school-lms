import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const classId = params.classId

    // Get teacher
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get class with students
    const classData = await db.class.findFirst({
      where: {
        id: classId,
        tenantId,
      },
      include: {
        students: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: {
            user: {
              fullName: 'asc',
            },
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get today's attendance for this class
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayAttendance = await db.attendance.findMany({
      where: {
        classId,
        teacherId: teacher.id,
        date: today,
      },
      select: {
        studentId: true,
        status: true,
      },
    })

    // Get today's grades for this class
    const todayGrades = await db.grade.findMany({
      where: {
        teacherId: teacher.id,
        date: today,
        student: {
          classId,
        },
      },
      select: {
        studentId: true,
        score: true,
      },
    })

    return NextResponse.json({
      class: classData,
      todayAttendance,
      todayGrades,
    })
  } catch (error) {
    console.error('Error fetching class data:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

