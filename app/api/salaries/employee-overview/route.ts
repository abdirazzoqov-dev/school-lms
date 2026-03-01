import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  let session
  try {
    session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const employeeType = searchParams.get('employeeType') as 'teacher' | 'staff'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const tenantId = session.user.tenantId!

    if (!employeeId || !employeeType) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // ✅ Authorization check: Admin/SuperAdmin/Moderator can view anyone, teachers/staff can only view themselves
    const isAdminLike = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'MODERATOR'
    if (!isAdminLike) {
      // Check if user is viewing their own data
      if (employeeType === 'teacher') {
        const teacher = await db.teacher.findUnique({
          where: { id: employeeId, tenantId },
          select: { userId: true }
        })
        if (!teacher || teacher.userId !== session.user.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
      } else {
        const staff = await db.staff.findUnique({
          where: { id: employeeId, tenantId },
          select: { userId: true }
        })
        if (!staff || staff.userId !== session.user.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
      }
    }

    // Get employee and monthly salary
    let monthlySalary = 0
    if (employeeType === 'teacher') {
      const teacher = await db.teacher.findUnique({
        where: { id: employeeId, tenantId },
        select: { monthlySalary: true }
      })
      if (!teacher) {
        return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 })
      }
      monthlySalary = Number(teacher.monthlySalary || 0)
    } else {
      const staff = await db.staff.findUnique({
        where: { id: employeeId, tenantId },
        select: { monthlySalary: true }
      })
      if (!staff) {
        return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 })
      }
      monthlySalary = Number(staff.monthlySalary || 0)
    }

    // Get all salary payments for the year
    const salaryPayments = await db.salaryPayment.findMany({
      where: {
        tenantId,
        ...(employeeType === 'teacher' ? { teacherId: employeeId } : { staffId: employeeId }),
        month: { gte: 1, lte: 12 },
        year
      },
      select: {
        id: true,
        month: true,
        year: true,
        amount: true,
        paidAmount: true,
        remainingAmount: true,
        status: true,
        type: true,
        salaryAmountAtPayment: true,
        dueDate: true,
        paymentDate: true,
        description: true,
        bonusAmount: true,
        deductionAmount: true
      }
    })

    // Get current date info
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Generate 12-month status array
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ]

    const monthlyStatuses = []

    for (let month = 1; month <= 12; month++) {
      // Filter payments for this month
      const monthPayments = salaryPayments.filter(p => p.month === month && p.year === year)
      
      const totalPaid = monthPayments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
      
      // ✅ CRITICAL: Find FULL_SALARY payment - its amount is the 100% target
      const fullSalaryPayment = monthPayments.find(p => p.type === 'FULL_SALARY')
      
      // Required amount is:
      // 1. If FULL_SALARY payment exists -> use its amount (includes bonus/deduction)
      // 2. Otherwise -> use current monthlySalary as default
      const requiredAmount = fullSalaryPayment
        ? Number(fullSalaryPayment.amount)
        : monthlySalary

      const percentagePaid = requiredAmount > 0 ? (totalPaid / requiredAmount) * 100 : 0
      const isFullyPaid = totalPaid >= requiredAmount && requiredAmount > 0

      // Find primary salary (PENDING or PARTIALLY_PAID)
      const primarySalary = monthPayments.find(s => s.status === 'PENDING' || s.status === 'PARTIALLY_PAID') || monthPayments[0]
      
      const hasSalary = monthPayments.length > 0
      const isPending = hasSalary && !isFullyPaid

      // Check if overdue
      const isOverdue = !isFullyPaid && (
        (year < currentYear) ||
        (year === currentYear && month < currentMonth)
      )

      let status: 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'not_due'
      
      if (isFullyPaid) {
        status = 'paid'
      } else if (isOverdue) {
        status = 'overdue'
      } else if (totalPaid > 0) {
        status = 'partially_paid'
      } else if (isPending || (year === currentYear && month <= currentMonth)) {
        status = 'pending'
      } else {
        status = 'not_due'
      }

      monthlyStatuses.push({
        month,
        year,
        monthName: monthNames[month - 1],
        totalPaid,
        requiredAmount,
        percentagePaid: Math.round(percentagePaid),
        isFullyPaid,
        isPending,
        isOverdue,
        hasSalary,
        salaryId: primarySalary?.id || null,
        status,
        payments: monthPayments.map(p => ({
          id: p.id,
          type: p.type,
          amount: Number(p.amount),
          paidAmount: Number(p.paidAmount),
          remainingAmount: Number(p.remainingAmount),
          status: p.status,
          paymentDate: p.paymentDate,
          description: p.description,
          bonusAmount: Number(p.bonusAmount || 0),
          deductionAmount: Number(p.deductionAmount || 0)
        }))
      })
    }

    return NextResponse.json({
      success: true,
      monthlyStatuses
    })

  } catch (error: any) {
    console.error('Error fetching employee salary overview:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

