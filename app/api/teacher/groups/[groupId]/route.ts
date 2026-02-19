import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { groupId } = await params

    // Get subjectId from query params
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId')

    // Get teacher
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get group with students
    const groupData = await db.group.findFirst({
      where: {
        id: groupId,
        tenantId,
      },
      include: {
        students: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { fullName: true, avatar: true } },
            class: { select: { id: true, name: true } },
          },
          orderBy: { user: { fullName: 'asc' } },
        },
      },
    })

    if (!groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get subject data if subjectId provided
    let subjectData = null
    if (subjectId) {
      subjectData = await db.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true },
      })
    }

    // Get today's attendance for these students (by teacher + subject)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const studentIds = groupData.students.map((s) => s.id)

    const attendanceWhere: any = {
      teacherId: teacher.id,
      date: today,
      studentId: { in: studentIds },
    }

    if (subjectId) {
      attendanceWhere.subjectId = subjectId
    }

    const todayAttendance = await db.attendance.findMany({
      where: attendanceWhere,
      select: { studentId: true, status: true },
    })

    // Get today's grades for these students
    const gradesWhere: any = {
      teacherId: teacher.id,
      date: today,
      studentId: { in: studentIds },
    }

    if (subjectId) {
      gradesWhere.subjectId = subjectId
    }

    const todayGrades = await db.grade.findMany({
      where: gradesWhere,
      select: { studentId: true, score: true },
    })

    return NextResponse.json({
      group: groupData,
      subject: subjectData,
      todayAttendance,
      todayGrades,
    })
  } catch (error) {
    console.error('Error fetching group data:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

