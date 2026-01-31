import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!

    // Get query params
    const searchParams = req.nextUrl.searchParams
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = { tenantId }
    if (month && year) {
      where.month = month
      where.year = year
    }
    if (type) where.type = type
    if (status) where.status = status
    
    // Search by employee name
    if (search) {
      where.OR = [
        {
          teacher: {
            user: {
              fullName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          staff: {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Get salary payments
    const salaryPayments = await db.salaryPayment.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        staff: {
          select: {
            staffCode: true,
            position: true,
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Generate CSV content with UTF-8 BOM for Excel
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ]

    const csvRows = [
      ['Xodim', 'Lavozim', 'Oy', 'Tur', 'Jami Maosh', 'To\'langan (Avans)', 'Qolgan', 'Foiz', 'Status', 'To\'lov Sanasi'].join(','),
      ...salaryPayments.map(payment => {
        const employee = payment.teacher ? payment.teacher.user : payment.staff?.user
        const employeeType = payment.teacher ? 'O\'qituvchi' : 'Xodim'
        const monthYear = payment.month && payment.year ? `${monthNames[payment.month - 1]} ${payment.year}` : 'N/A'
        const paymentType = 
          payment.type === 'FULL_SALARY' ? 'Oylik' :
          payment.type === 'ADVANCE' ? 'Avans' :
          payment.type === 'BONUS' ? 'Mukofot' :
          payment.type === 'DEDUCTION' ? 'Ushlab qolish' : 'Boshqa'
        
        const totalAmount = Number(payment.amount)
        const paidAmount = Number(payment.paidAmount || 0)
        const remainingAmount = Number(payment.remainingAmount || 0)
        const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
        
        const statusText = 
          payment.status === 'PAID' ? 'To\'langan' :
          payment.status === 'PENDING' ? 'Kutilmoqda' :
          payment.status === 'PARTIALLY_PAID' ? 'Qisman to\'langan' : 'Noma\'lum'
        
        const paymentDate = payment.paymentDate 
          ? new Date(payment.paymentDate).toLocaleDateString('uz-UZ') 
          : 'N/A'

        return [
          employee?.fullName || 'N/A',
          employeeType,
          monthYear,
          paymentType,
          totalAmount,
          paidAmount,
          remainingAmount,
          `${percentage}%`,
          statusText,
          paymentDate
        ].join(',')
      })
    ]

    // Add UTF-8 BOM for proper Excel encoding
    const BOM = '\uFEFF'
    const csvContent = BOM + csvRows.join('\n')
    
    const filename = month && year 
      ? `maoshlar-${monthNames[month - 1]}-${year}.csv`
      : `maoshlar-${new Date().toLocaleDateString('uz-UZ')}.csv`
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting salaries:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

