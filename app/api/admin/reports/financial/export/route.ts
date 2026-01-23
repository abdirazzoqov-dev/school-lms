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
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Date range
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Get payments
    const payments = await db.payment.findMany({
      where: {
        tenantId,
        paidDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    })

    // Get expenses
    const expenses = await db.expense.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Generate CSV
    const csvRows = [
      ['Moliyaviy Hisobot - ' + month + '/' + year],
      [],
      ['KIRIMLAR'],
      ['#', 'Sana', 'O\'quvchi', 'Turi', 'Summa (so\'m)', 'Status'].join(',')
    ]

    payments.forEach((payment, index) => {
      const typeText = 
        payment.paymentType === 'TUITION' ? 'O\'qish haqi' :
        payment.paymentType === 'BOOKS' ? 'Darsliklar' :
        payment.paymentType === 'UNIFORM' ? 'Forma' : 'Boshqa'

      csvRows.push([
        index + 1,
        payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : 'N/A',
        payment.student.user.fullName,
        typeText,
        Number(payment.paidAmount || 0).toString(),
        payment.status === 'COMPLETED' ? 'To\'langan' : 'Kutilmoqda'
      ].join(','))
    })

    csvRows.push([])
    csvRows.push(['XARAJATLAR'])
    csvRows.push(['#', 'Sana', 'Kategoriya', 'Tavsif', 'Summa (so\'m)'].join(','))

    expenses.forEach((expense, index) => {
      csvRows.push([
        index + 1,
        new Date(expense.date).toLocaleDateString('uz-UZ'),
        expense.category.name,
        expense.description || 'N/A',
        Number(expense.amount).toString()
      ].join(','))
    })

    const totalIncome = payments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netProfit = totalIncome - totalExpenses

    csvRows.push([])
    csvRows.push(['JAMI'])
    csvRows.push(['Jami Kirim', totalIncome.toString() + ' so\'m'].join(','))
    csvRows.push(['Jami Xarajat', totalExpenses.toString() + ' so\'m'].join(','))
    csvRows.push(['Sof Foyda', netProfit.toString() + ' so\'m'].join(','))

    const csv = '\uFEFF' + csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="moliyaviy-hisobot-${year}-${month}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Export financial report error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}

