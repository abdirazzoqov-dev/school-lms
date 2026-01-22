import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tenantId = session.user.tenantId!

    // Get teacher
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return new NextResponse('Teacher not found', { status: 404 })
    }

    // Get all grades
    const grades = await db.grade.findMany({
      where: {
        teacherId: teacher.id,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true }
            },
            class: {
              select: { name: true }
            }
          }
        },
        subject: {
          select: { name: true }
        }
      }
    })

    // Create CSV content
    const csvRows = [
      'O\'quvchi,Sinf,Fan,Turi,Ball,Foiz,Sana',
      ...grades.map(grade =>
        `${grade.student.user?.fullName || 'N/A'},` +
        `${grade.student.class?.name || '-'},` +
        `${grade.subject.name},` +
        `${grade.gradeType},` +
        `${Number(grade.score)}/${Number(grade.maxScore)},` +
        `${Number(grade.percentage).toFixed(0)}%,` +
        `${new Date(grade.date).toLocaleDateString('uz-UZ')}`
      )
    ].join('\n')

    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF'
    const csvContent = bom + csvRows

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="baholar-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('[TEACHER_GRADES_EXPORT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

