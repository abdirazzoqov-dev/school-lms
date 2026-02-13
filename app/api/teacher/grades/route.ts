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
    const startTime = grades[0]?.startTime
    const endTime = grades[0]?.endTime
    
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
    today.setHours(0, 0, 0, 0) // Normalize to start of day
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const academicYear = `${currentMonth >= 8 ? currentYear : currentYear - 1}-${currentMonth >= 8 ? currentYear + 1 : currentYear}`
    
    // Get current quarter (1=Sep-Nov, 2=Dec-Feb, 3=Mar-May, 4=Jun-Aug)
    let quarter = 1
    if (currentMonth >= 11 || currentMonth <= 1) quarter = 2
    else if (currentMonth >= 2 && currentMonth <= 4) quarter = 3
    else if (currentMonth >= 5 && currentMonth <= 7) quarter = 4
    
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
        quarter: quarter,
        academicYear,
        date: today,
        startTime: startTime || null,
        endTime: endTime || null,
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

