import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { paidAmount, paymentDate, paymentMethod, description, notes } = await request.json()

    // Get current salary payment
    const salary = await db.salaryPayment.findUnique({
      where: { id: params.id, tenantId }
    })

    if (!salary) {
      return NextResponse.json({ success: false, error: 'Maosh to\'lovi topilmadi' }, { status: 404 })
    }

    const totalAmount = Number(salary.amount)
    const newPaidAmount = Number(paidAmount)
    const remainingAmount = Math.max(0, totalAmount - newPaidAmount)
    
    // Determine status
    let status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' = 'PENDING'
    if (newPaidAmount >= totalAmount) {
      status = 'PAID'
    } else if (newPaidAmount > 0) {
      status = 'PARTIALLY_PAID'
    }

    // Update salary payment
    const updatedSalary = await db.salaryPayment.update({
      where: { id: params.id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount,
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMethod,
        description,
        notes,
        paidById: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      salary: updatedSalary
    })

  } catch (error: any) {
    console.error('Error updating salary payment:', error)
    return NextResponse.json(
      { success: false, error: 'Xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

