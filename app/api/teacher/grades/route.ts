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

    // Need to get subjectId from classSubjects
    // For now, we'll use the first subject the teacher teaches in this class
    const classId = grades[0]?.classId
    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    const classSubject = await db.classSubject.findFirst({
      where: {
        classId,
        teacherId: teacher.id,
      },
    })

    if (!classSubject) {
      return NextResponse.json(
        { error: 'You do not teach this class' },
        { status: 403 }
      )
    }

    // Create grade records
    const created = await db.grade.createMany({
      data: grades.map((gradeData) => ({
        tenantId,
        studentId: gradeData.studentId,
        teacherId: teacher.id,
        classId: gradeData.classId,
        subjectId: classSubject.subjectId,
        grade: gradeData.grade,
        quarter: 1, // Default to Q1 - can be made dynamic later
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

