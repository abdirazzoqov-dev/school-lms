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
    const status = searchParams.get('status')

    // Build where clause
    const where: any = { tenantId }
    if (classId) where.classId = classId
    if (status) where.status = status

    // Get students
    const students = await db.student.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        },
        class: {
          select: {
            name: true
          }
        },
        payments: {
          select: {
            paidAmount: true
          }
        },
        attendances: {
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
          },
          select: {
            status: true
          }
        },
        grades: {
          where: {
            date: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
          },
          select: {
            score: true
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    })

    // Generate CSV
    const csvRows = [
      ['#', 'Kod', 'Ism Familiya', 'Sinf', 'Status', 'Jins', 'Email', 'Telefon', 'Davomat %', 'O\'rtacha Baho', 'To\'lovlar (so\'m)'].join(',')
    ]

    students.forEach((student, index) => {
      const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
      const attendanceRate = student.attendances.length > 0
        ? ((student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) * 100).toFixed(0)
        : '0'
      const avgGrade = student.grades.length > 0
        ? (student.grades.reduce((sum, g) => sum + Number(g.score), 0) / student.grades.length).toFixed(1)
        : 'N/A'

      csvRows.push([
        index + 1,
        student.studentCode,
        student.user?.fullName || 'N/A',
        student.class?.name || 'N/A',
        student.status === 'ACTIVE' ? 'Faol' : student.status === 'GRADUATED' ? 'Bitirgan' : 'Haydal gan',
        student.gender === 'MALE' ? 'O\'g\'il' : 'Qiz',
        student.user?.email || 'N/A',
        student.user?.phone || 'N/A',
        attendanceRate + '%',
        avgGrade,
        totalPaid.toString()
      ].join(','))
    })

    const csv = '\uFEFF' + csvRows.join('\n') // UTF-8 BOM for Excel

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="oquvchilar-hisoboti-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Export students report error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}

