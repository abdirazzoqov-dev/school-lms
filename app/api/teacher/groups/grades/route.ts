import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!

    // Get teacher
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await req.json()
    const { grades } = body

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const groupId = grades[0]?.groupId
    const subjectId = grades[0]?.subjectId
    const startTime: string | null = grades[0]?.startTime || null
    const endTime: string | null = grades[0]?.endTime || null

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })
    }

    // Verify teacher teaches this subject in this group via GroupSchedule
    const groupSchedule = await db.groupSchedule.findFirst({
      where: {
        groupId,
        subjectId,
        teacherId: teacher.id,
      },
    })

    if (!groupSchedule) {
      return NextResponse.json(
        { error: 'You do not teach this subject in this group' },
        { status: 403 }
      )
    }

    // Calculate current academic info
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const academicYear = `${currentMonth >= 8 ? currentYear : currentYear - 1}-${currentMonth >= 8 ? currentYear + 1 : currentYear}`

    // Get current quarter
    let quarter = 1
    if (currentMonth >= 11 || currentMonth <= 1) quarter = 2
    else if (currentMonth >= 2 && currentMonth <= 4) quarter = 3
    else if (currentMonth >= 5 && currentMonth <= 7) quarter = 4

    // Filter valid grades (1-5 range)
    const validGrades = grades.filter(
      (g) => g.grade && g.grade >= 1 && g.grade <= 5 && g.studentId
    )

    if (validGrades.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    // Delete existing grades for today (same student + subject + group + teacher + date)
    const studentIds = validGrades.map((g: { studentId: string }) => g.studentId)
    await db.grade.deleteMany({
      where: {
        teacherId: teacher.id,
        subjectId,
        groupId,
        date: today,
        studentId: { in: studentIds },
      },
    })

    // Create new grade records
    const created = await db.grade.createMany({
      data: validGrades.map((gradeData: { studentId: string; grade: number; startTime?: string; endTime?: string }) => ({
        tenantId,
        studentId: gradeData.studentId,
        teacherId: teacher.id,
        subjectId,
        groupId,
        gradeType: 'ORAL',
        score: gradeData.grade,
        maxScore: 5,
        percentage: (gradeData.grade / 5) * 100,
        quarter,
        academicYear,
        date: today,
        startTime: gradeData.startTime || startTime || null,
        endTime: gradeData.endTime || endTime || null,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
    })
  } catch (error) {
    console.error('Error saving group grades:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

