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

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Get classId and subjectId from the first grade record
    const classId = grades[0]?.classId
    const subjectId = grades[0]?.subjectId
    
    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })
    }

    // Verify teacher teaches this class and subject via Schedule (constructor)
    const schedule = await db.schedule.findFirst({
      where: {
        classId,
        subjectId,
        teacherId: teacher.id,
        type: 'LESSON'
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'You do not teach this subject in this class' },
        { status: 403 }
      )
    }

    // Create grade records
    const today = new Date()
    const academicYear = `${today.getFullYear()}-${today.getFullYear() + 1}`
    
    const created = await db.grade.createMany({
      data: grades.map((gradeData) => ({
        tenantId,
        studentId: gradeData.studentId,
        teacherId: teacher.id,
        subjectId: subjectId,
        gradeType: 'ORAL', // Default type
        score: gradeData.grade,
        maxScore: 5,
        percentage: (gradeData.grade / 5) * 100,
        quarter: 1,
        academicYear,
        date: today,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
    })
  } catch (error) {
    console.error('Error saving grades:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

