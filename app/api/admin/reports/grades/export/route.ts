import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')

    // Build where clause
    const where: any = { tenantId }
    if (classId) where.student = { classId }
    if (subjectId) where.subjectId

    // Get grades
    const grades = await db.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            },
            class: {
              select: {
                name: true
              }
            }
          }
        },
        subject: {
          select: {
            name: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Generate CSV
    const csvRows = [
      ['#', 'Sana', 'O\'quvchi', 'Sinf', 'Fan', 'Baho', 'Turi', 'Foiz', 'O\'qituvchi'].join(',')
    ]

    grades.forEach((grade, index) => {
      const gradeTypeText = 
        grade.gradeType === 'ORAL' ? 'Og\'zaki' :
        grade.gradeType === 'WRITTEN' ? 'Yozma' :
        grade.gradeType === 'TEST' ? 'Test' :
        grade.gradeType === 'EXAM' ? 'Imtihon' :
        grade.gradeType === 'QUARTER' ? 'Chorak' : 'Yillik'

      csvRows.push([
        index + 1,
        new Date(grade.date).toLocaleDateString('uz-UZ'),
        grade.student.user.fullName,
        grade.student.class?.name || 'N/A',
        grade.subject.name,
        Number(grade.score).toString(),
        gradeTypeText,
        Number(grade.percentage).toFixed(0) + '%',
        grade.teacher.user.fullName
      ].join(','))
    })

    const csv = '\uFEFF' + csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="baholar-hisoboti-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Export grades report error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}

