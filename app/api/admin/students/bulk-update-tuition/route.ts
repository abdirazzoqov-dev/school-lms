import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-error-handler'

/**
 * TOPSHIRIQ 2: Ommaviy to\'lov o\'zgartirish API
 * 
 * Senior Software Engineer yechimi:
 * - Bir nechta o\'quvchining oylik to\'lovini bir vaqtda o\'zgartirish
 * - Faqat kelgusi to\'lovlarga ta\'sir qiladi
 * - Avvalgi to\'lovlar o\'zgarmaydi (snapshot orqali)
 */
export async function POST(req: NextRequest) {
  let session
  try {
    session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Faqat admin ruxsat etilgan" },
        { status: 403 }
      )
    }

    const tenantId = session.user.tenantId!
    const body = await req.json()
    
    const { 
      studentIds,      // O\'quvchilar ID\'lari
      newTuitionFee,   // Yangi to\'lov miqdori
      effectiveDate    // Qaysi oydan boshlab (optional)
    } = body

    // Validation
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Kamida bitta o'quvchi tanlang" },
        { status: 400 }
      )
    }

    if (!newTuitionFee || parseFloat(newTuitionFee) < 0) {
      return NextResponse.json(
        { error: "To'lov miqdori noto'g'ri" },
        { status: 400 }
      )
    }

    // ✅ Bulk update - bir queryda hammasi
    const result = await db.student.updateMany({
      where: {
        tenantId,
        id: { in: studentIds }
      },
      data: {
        monthlyTuitionFee: parseFloat(newTuitionFee)
      }
    })

    // ✅ Agar effectiveDate berilgan bo'lsa, kelgusi to'lovlarni yangilash
    if (effectiveDate) {
      const effectiveDateObj = new Date(effectiveDate)
      const effectiveMonth = effectiveDateObj.getMonth() + 1 // 1-12
      const effectiveYear = effectiveDateObj.getFullYear()

      // Faqat kelgusi to'lovlarni yangilash (PENDING status)
      await db.payment.updateMany({
        where: {
          tenantId,
          studentId: { in: studentIds },
          status: 'PENDING',
          OR: [
            { paymentYear: { gt: effectiveYear } },
            {
              paymentYear: effectiveYear,
              paymentMonth: { gte: effectiveMonth }
            }
          ]
        },
        data: {
          amount: parseFloat(newTuitionFee),
          remainingAmount: parseFloat(newTuitionFee),
          tuitionFeeAtPayment: parseFloat(newTuitionFee) // ✅ Snapshot yangilash
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} ta o'quvchining to'lovi yangilandi`,
      updatedCount: result.count
    })

  } catch (error: any) {
    return handleApiError(error, {
      tenantId: session?.user?.tenantId || undefined,
      userId: session?.user?.id || undefined,
      action: 'bulk-update-tuition'
    })
  }
}

