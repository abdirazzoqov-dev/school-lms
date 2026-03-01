'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ─── Create Exam ─────────────────────────────────────────────────────────────
export async function createExam(data: {
  title: string
  description?: string
  date?: string
  duration?: number
  subjects: {
    subjectName: string
    questionCount: number
    pointsPerQ: number
    correctAnswers: Record<string, string>
    order: number
  }[]
}) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!

  try {
    const exam = await db.exam.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description || null,
        date: data.date ? new Date(data.date) : null,
        duration: data.duration || null,
        status: 'DRAFT',
        createdById: session.user.id,
        subjects: {
          create: data.subjects.map(s => ({
            subjectName: s.subjectName,
            questionCount: s.questionCount,
            pointsPerQ: s.pointsPerQ,
            correctAnswers: s.correctAnswers,
            order: s.order,
          }))
        }
      },
      include: { subjects: true }
    })

    revalidatePath('/admin/exams')
    return { success: true, exam }
  } catch (e: any) {
    return { success: false, error: e.message || 'Xatolik yuz berdi' }
  }
}

// ─── Update Exam Status ───────────────────────────────────────────────────────
export async function updateExamStatus(examId: string, status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'ARCHIVED') {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!
  try {
    await db.exam.update({ where: { id: examId, tenantId }, data: { status } })
    revalidatePath('/admin/exams')
    revalidatePath(`/admin/exams/${examId}`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Delete Exam ──────────────────────────────────────────────────────────────
export async function deleteExam(examId: string) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!
  try {
    await db.exam.delete({ where: { id: examId, tenantId } })
    revalidatePath('/admin/exams')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Save Exam Result (manual or scan) ───────────────────────────────────────
export async function saveExamResult(data: {
  examId: string
  studentId: string
  answers: Record<string, Record<string, string>>
  source?: 'MANUAL' | 'SCAN'
  notes?: string
  variantId?: string  // if set, use variant's answer key for scoring
}) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!

  try {
    const exam = await db.exam.findUnique({
      where: { id: data.examId, tenantId },
      include: { subjects: { orderBy: { order: 'asc' } } }
    })
    if (!exam) return { success: false, error: 'Imtihon topilmadi' }

    // If variantId provided, load its answer key
    let variantAnswerKeys: Record<string, Record<string, string>> | null = null
    if (data.variantId) {
      const variant = await db.examVariant.findUnique({
        where: { id: data.variantId, tenantId }
      })
      if (variant) {
        const vData = variant.questionData as any
        const keys: Record<string, Record<string, string>> = {}
        for (const sub of (vData.subjects || [])) {
          keys[String(sub.subjectOrder)] = sub.answerKey || {}
        }
        variantAnswerKeys = keys
      }
    }

    const scores: Record<string, {
      correct: number; wrong: number; empty: number; score: number; total: number; maxScore: number
    }> = {}
    let totalScore = 0
    let totalMax = 0

    for (const subject of exam.subjects) {
      const key = String(subject.order)
      // Variant answer key takes priority over subject's correctAnswers
      const correctAnswers = variantAnswerKeys?.[key] ?? (subject.correctAnswers as Record<string, string>)
      const studentAnswers = data.answers[key] || {}

      let correct = 0, wrong = 0, empty = 0

      for (let q = 1; q <= subject.questionCount; q++) {
        const qStr = String(q)
        const studentAns = studentAnswers[qStr]
        const correctAns = correctAnswers[qStr]
        if (!studentAns) empty++
        else if (studentAns.toUpperCase() === correctAns?.toUpperCase()) correct++
        else wrong++
      }

      const subjectScore = correct * subject.pointsPerQ
      const subjectMax = subject.questionCount * subject.pointsPerQ
      scores[key] = { correct, wrong, empty, score: subjectScore, total: subject.questionCount, maxScore: subjectMax }
      totalScore += subjectScore
      totalMax += subjectMax
    }

    const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0

    const result = await db.examResult.upsert({
      where: { examId_studentId: { examId: data.examId, studentId: data.studentId } },
      update: {
        answers: data.answers, scores, totalScore, totalMax, percentage,
        source: data.source || 'MANUAL', notes: data.notes || null,
        variantId: data.variantId || null,
      },
      create: {
        examId: data.examId, studentId: data.studentId, tenantId,
        answers: data.answers, scores, totalScore, totalMax, percentage,
        source: data.source || 'MANUAL', notes: data.notes || null,
        variantId: data.variantId || null,
      }
    })

    revalidatePath(`/admin/exams/${data.examId}`)
    revalidatePath('/parent/exams')
    return { success: true, result, totalScore, totalMax, percentage, scores }
  } catch (e: any) {
    console.error('saveExamResult error:', e)
    return { success: false, error: e.message || 'Xatolik' }
  }
}

// ─── Bulk save results ────────────────────────────────────────────────────────
export async function saveBulkExamResults(data: {
  examId: string
  results: {
    studentId: string
    answers: Record<string, Record<string, string>>
    source?: 'MANUAL' | 'SCAN'
  }[]
}) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const results = await Promise.all(
    data.results.map(r => saveExamResult({ ...r, examId: data.examId }))
  )

  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    return { success: false, error: `${failed.length} ta natija saqlanmadi`, partial: true }
  }

  revalidatePath(`/admin/exams/${data.examId}`)
  return { success: true, count: results.length }
}
