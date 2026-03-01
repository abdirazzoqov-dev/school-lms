'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface VariantQuestion {
  id: string
  order: number        // pozitsiya bu variantda (1-dan)
  text: string
  optionA: string
  optionB: string
  optionC: string | null
  optionD: string | null
  optionE: string | null
  correctAnswer: string  // To'g'ri variant harfi
}

export interface VariantSubject {
  subjectId: string
  subjectName: string
  subjectOrder: number
  pointsPerQ: number
  questions: VariantQuestion[]
  answerKey: Record<string, string>  // { "1": "A", "2": "C", ... }
}

export interface VariantData {
  subjects: VariantSubject[]
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Generate a new exam variant ─────────────────────────────────────────────
export async function generateExamVariant(examId: string, variantNum?: number) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!

  const exam = await db.exam.findUnique({
    where: { id: examId, tenantId },
    include: {
      subjects: {
        orderBy: { order: 'asc' },
        include: {
          questionBank: {
            include: {
              questions: {
                where: { correctAnswer: { not: null } },
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      },
      variants: { orderBy: { variantNum: 'desc' }, take: 1 }
    }
  })

  if (!exam) return { success: false, error: 'Imtihon topilmadi' }

  // Determine variant number
  const nextNum = variantNum ?? (exam.variants[0]?.variantNum ?? 0) + 1
  const variantName = `Variant ${nextNum}`

  const variantSubjects: VariantSubject[] = []

  for (const sub of exam.subjects) {
    const bank = sub.questionBank
    let shuffledQuestions: VariantQuestion[] = []

    if (bank && bank.questions.length > 0) {
      // Shuffle and select from bank
      const allBankQ = bank.questions.filter(q => q.correctAnswer)
      const selected = shuffleArray(allBankQ).slice(0, sub.questionCount)

      shuffledQuestions = selected.map((q, idx) => ({
        id: q.id,
        order: idx + 1,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        correctAnswer: q.correctAnswer!,
      }))
    } else {
      // No bank linked — use existing correctAnswers as-is, no shuffling
      const existingKey = sub.correctAnswers as Record<string, string>
      const answerKey: Record<string, string> = {}
      for (let i = 1; i <= sub.questionCount; i++) {
        answerKey[String(i)] = existingKey[String(i)] || ''
      }
      variantSubjects.push({
        subjectId: sub.id,
        subjectName: sub.subjectName,
        subjectOrder: sub.order,
        pointsPerQ: sub.pointsPerQ,
        questions: [], // no question text
        answerKey,
      })
      continue
    }

    // Build answer key for this variant (position → correct letter)
    const answerKey: Record<string, string> = {}
    shuffledQuestions.forEach(q => {
      answerKey[String(q.order)] = q.correctAnswer
    })

    variantSubjects.push({
      subjectId: sub.id,
      subjectName: sub.subjectName,
      subjectOrder: sub.order,
      pointsPerQ: sub.pointsPerQ,
      questions: shuffledQuestions,
      answerKey,
    })
  }

  const questionData: VariantData = { subjects: variantSubjects }

  const variant = await db.examVariant.create({
    data: {
      examId,
      tenantId,
      variantNum: nextNum,
      variantName,
      questionData: questionData as any,
    }
  })

  revalidatePath(`/admin/exams/${examId}/booklet`)

  return { success: true, variantId: variant.id, variantNum: nextNum, variantName }
}

// ─── Delete a variant ─────────────────────────────────────────────────────────
export async function deleteExamVariant(variantId: string) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!
  await db.examVariant.delete({ where: { id: variantId, tenantId } })
  return { success: true }
}

// ─── Save manual student→variant assignments ──────────────────────────────────
export async function saveManualAssignments(
  examId: string,
  assignments: { studentId: string; variantId: string }[]
) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false as const, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!
  if (assignments.length === 0) return { success: true as const, savedCount: 0 }

  await Promise.all(assignments.map(({ studentId, variantId }) =>
    db.examResult.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: { variantId },
      create: {
        examId, studentId, tenantId, variantId,
        answers: {}, scores: {}, totalScore: 0, totalMax: 0, percentage: 0, source: 'MANUAL'
      }
    })
  ))

  revalidatePath(`/admin/exams/${examId}/booklet`)
  revalidatePath(`/admin/exams/${examId}/answer-sheet`)
  return { success: true as const, savedCount: assignments.length }
}

// ─── Batch: create N variants, assign each student to one round-robin ─────────
// Saves assignment as ExamResult rows (answers={}, scores={}, only variantId set)
export async function assignVariantsToStudents(
  examId: string,
  variantCount: number,
  studentIds: string[]
) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return { success: false as const, error: 'Ruxsat berilmagan' }

  const tenantId = session.user.tenantId!
  if (variantCount < 1 || variantCount > 20) return { success: false as const, error: 'Variant soni 1–20 orasida bo\'lishi kerak' }
  if (studentIds.length === 0) return { success: false as const, error: 'O\'quvchilar ro\'yxati bo\'sh' }

  // 1. Load exam with subjects + banks (same as generateExamVariant)
  const exam = await db.exam.findUnique({
    where: { id: examId, tenantId },
    include: {
      subjects: {
        orderBy: { order: 'asc' },
        include: {
          questionBank: {
            include: {
              questions: {
                where: { correctAnswer: { not: null } },
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      },
      variants: { orderBy: { variantNum: 'desc' }, take: 1 }
    }
  })
  if (!exam) return { success: false as const, error: 'Imtihon topilmadi' }

  const startNum = (exam.variants[0]?.variantNum ?? 0) + 1

  // 2. Generate `variantCount` unique variants
  const createdVariants: { id: string; variantNum: number; variantName: string }[] = []

  for (let n = 0; n < variantCount; n++) {
    const vNum = startNum + n
    const variantName = `Variant ${vNum}`

    const variantSubjects: VariantSubject[] = []
    for (const sub of exam.subjects) {
      const bank = sub.questionBank
      if (bank && bank.questions.length > 0) {
        const selected = shuffleArray(bank.questions.filter(q => q.correctAnswer)).slice(0, sub.questionCount)
        const shuffledQuestions: VariantQuestion[] = selected.map((q, idx) => ({
          id: q.id, order: idx + 1, text: q.text,
          optionA: q.optionA, optionB: q.optionB,
          optionC: q.optionC, optionD: q.optionD, optionE: q.optionE,
          correctAnswer: q.correctAnswer!,
        }))
        const answerKey: Record<string, string> = {}
        shuffledQuestions.forEach(q => { answerKey[String(q.order)] = q.correctAnswer })
        variantSubjects.push({
          subjectId: sub.id, subjectName: sub.subjectName,
          subjectOrder: sub.order, pointsPerQ: sub.pointsPerQ,
          questions: shuffledQuestions, answerKey,
        })
      } else {
        const existingKey = sub.correctAnswers as Record<string, string>
        const answerKey: Record<string, string> = {}
        for (let i = 1; i <= sub.questionCount; i++) answerKey[String(i)] = existingKey[String(i)] || ''
        variantSubjects.push({
          subjectId: sub.id, subjectName: sub.subjectName,
          subjectOrder: sub.order, pointsPerQ: sub.pointsPerQ,
          questions: [], answerKey,
        })
      }
    }

    const v = await db.examVariant.create({
      data: { examId, tenantId, variantNum: vNum, variantName, questionData: { subjects: variantSubjects } as any }
    })
    createdVariants.push({ id: v.id, variantNum: vNum, variantName })
  }

  // 3. Assign students round-robin and upsert empty ExamResults
  const assignments: { studentId: string; variantId: string }[] = []
  for (let i = 0; i < studentIds.length; i++) {
    const variant = createdVariants[i % variantCount]
    assignments.push({ studentId: studentIds[i], variantId: variant.id })
  }

  // Upsert: if result already exists update variantId, otherwise create empty
  await Promise.all(assignments.map(({ studentId, variantId }) =>
    db.examResult.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: { variantId },
      create: {
        examId, studentId, tenantId, variantId,
        answers: {}, scores: {}, totalScore: 0, totalMax: 0, percentage: 0, source: 'MANUAL'
      }
    })
  ))

  revalidatePath(`/admin/exams/${examId}/booklet`)
  revalidatePath(`/admin/exams/${examId}/answer-sheet`)

  return {
    success: true as const,
    variants: createdVariants,
    assignedCount: studentIds.length,
  }
}
