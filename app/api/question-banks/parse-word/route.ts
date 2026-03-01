import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import mammoth from 'mammoth'

// ─── Word Savol Parser ────────────────────────────────────────────────────────
/**
 * Word fayldan savollarni avtomatik tortib oladi.
 * 
 * Qo'llab-quvvatlanadigan formatlar:
 * 
 * Format 1 (raqam + savol + variantlar alohida satrlarda):
 *   1. Savol matni?
 *   A) Variant A
 *   B) Variant B
 *   C) Variant C
 *   D) Variant D
 * 
 * Format 2 (variantlar bir qatorda):
 *   1. Savol matni?
 *   A) Variant A   B) Variant B   C) Variant C   D) Variant D
 * 
 * Format 3 (variantlar savol bilan bir qatorda):
 *   1. Savol A) Va1 B) Va2 C) Va3 D) Va4
 */
interface ParsedQuestion {
  text: string
  optionA: string
  optionB: string
  optionC?: string
  optionD?: string
  optionE?: string
  correctAnswer?: string  // * belgisi orqali avtomatik aniqlanadi
  order: number
}

/**
 * Bir option satrini parse qiladi.
 * Formatlar:
 *   *A) matn    →  { letter:'A', text:'matn', correct:true }
 *   A) matn     →  { letter:'A', text:'matn', correct:false }
 *   *A. matn    →  correct:true
 */
function parseOptionLine(raw: string): { letter: string; text: string; correct: boolean } | null {
  // * belgisi variant oldida bo'lishi mumkin: "*A)", "* A)", "*A."
  const m = raw.match(/^(\*?)\s*([A-Ea-e])\s*[\)\.]\s*(.+)/)
  if (!m) return null
  return {
    letter: m[2].toUpperCase(),
    text: m[3].trim(),
    correct: m[1] === '*',
  }
}

function parseQuestionsFromText(rawText: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Normalize newlines and excessive whitespace
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let i = 0
  let qOrder = 0

  while (i < lines.length) {
    const line = lines[i]

    // New question line: "1.", "1)", "2." etc. (may start with * if question itself is starred — ignore)
    const qMatch = line.replace(/^\*\s*/, '').match(/^(\d+)\s*[\.\)]\s*(.+)/)
    if (!qMatch) { i++; continue }

    let questionText = qMatch[2].trim()
    const opts: Record<string, string> = {}
    let correctAnswer = ''

    // ── Case 1: options on the SAME line as question ──────────────────────────
    // e.g. "1. Savol? *A) abc B) def C) ghi D) jkl"
    // Detect by presence of  A) or *A)  inside questionText
    const sameLineOptRx = /\s+\*?[A-Ea-e]\s*[\)\.]/
    if (sameLineOptRx.test(questionText)) {
      // Split on option boundaries: *A) | A) | *A. | A.
      const parts = questionText.split(/(?=\s+\*?[A-Ea-e]\s*[\)\.])/g)
      questionText = parts[0].trim()

      for (let p = 1; p < parts.length; p++) {
        const parsed = parseOptionLine(parts[p].trim())
        if (parsed) {
          opts[parsed.letter] = parsed.text
          if (parsed.correct) correctAnswer = parsed.letter
        }
      }
      i++
    } else {
      // ── Case 2: options on subsequent lines ───────────────────────────────
      i++
      const optLines: string[] = []

      while (i < lines.length) {
        const nextLine = lines[i]
        // Stop at next question number
        if (nextLine.replace(/^\*\s*/, '').match(/^\d+\s*[\.\)]\s*.+/)) break

        optLines.push(nextLine)
        i++

        // Stop once we have collected D or E option
        const combined = optLines.join('\n')
        if (/\*?[Dd]\s*[\)\.]/.test(combined)) {
          // Peek ahead — if next line is also an option, continue; otherwise stop
          const nextLineAhead = lines[i]?.trim() || ''
          if (nextLineAhead && !parseOptionLine(nextLineAhead)) break
        }
      }

      // Try line-by-line first (each option on its own line)
      const linesParsed = optLines.map(parseOptionLine).filter(Boolean) as ReturnType<typeof parseOptionLine>[]

      if (linesParsed.length >= 2) {
        linesParsed.forEach(p => {
          if (p) {
            opts[p.letter] = p.text
            if (p.correct) correctAnswer = p.letter
          }
        })
      } else {
        // Fallback: all options on one combined line
        // e.g. "A) v1   *B) v2   C) v3   D) v4"
        const combined = optLines.join(' ')
        const parts = combined.split(/(?=\s+\*?[A-Ea-e]\s*[\)\.])/g)
        for (const part of parts) {
          const parsed = parseOptionLine(part.trim())
          if (parsed) {
            opts[parsed.letter] = parsed.text
            if (parsed.correct) correctAnswer = parsed.letter
          }
        }
      }
    }

    if (questionText && opts['A'] && opts['B']) {
      questions.push({
        text: questionText,
        optionA: opts['A'],
        optionB: opts['B'],
        optionC: opts['C'] || undefined,
        optionD: opts['D'] || undefined,
        optionE: opts['E'] || undefined,
        correctAnswer: correctAnswer || undefined,
        order: qOrder++,
      })
    }
  }

  return questions
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
    if (!session || !isAdminLike) {
      return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const formData = await request.formData()

    const file = formData.get('file') as File
    const subjectName = formData.get('subjectName') as string
    const description = formData.get('description') as string | null
    const bankId = formData.get('bankId') as string | null // existing bank to replace

    if (!file) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    if (!subjectName) return NextResponse.json({ error: 'Fan nomi kiritilmagan' }, { status: 400 })

    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext !== 'docx' && ext !== 'doc') {
      return NextResponse.json({ error: 'Faqat .docx yoki .doc fayl qabul qilinadi' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Word file with mammoth
    let rawText = ''
    try {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    } catch (e) {
      return NextResponse.json({ error: 'Word faylni o\'qishda xatolik. Fayl shikastlangan bo\'lishi mumkin.' }, { status: 400 })
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Fayl bo\'sh yoki matn topilmadi' }, { status: 400 })
    }

    // Parse questions from text
    const parsedQuestions = parseQuestionsFromText(rawText)

    if (parsedQuestions.length === 0) {
      return NextResponse.json({
        error: 'Savollar topilmadi. Word faylida quyidagi formatda savollar yozing:\n\n1. Savol matni?\nA) Variant\nB) Variant\nC) Variant\nD) Variant',
        rawTextPreview: rawText.slice(0, 500)
      }, { status: 400 })
    }

    // Save to database
    let bank
    if (bankId) {
      // Update existing bank
      await db.question.deleteMany({ where: { bankId } })
      bank = await db.questionBank.update({
        where: { id: bankId, tenantId },
        data: {
          subjectName,
          description: description || null,
          fileName,
          totalCount: parsedQuestions.length,
          questions: {
            create: parsedQuestions.map(q => ({
              tenantId,
              text: q.text,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC || null,
              optionD: q.optionD || null,
              optionE: q.optionE || null,
              correctAnswer: q.correctAnswer || null,
              order: q.order,
            }))
          }
        },
        include: { questions: { orderBy: { order: 'asc' } } }
      })
    } else {
      bank = await db.questionBank.create({
        data: {
          tenantId,
          subjectName,
          description: description || null,
          fileName,
          totalCount: parsedQuestions.length,
          createdById: session.user.id,
          questions: {
            create: parsedQuestions.map(q => ({
              tenantId,
              text: q.text,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC || null,
              optionD: q.optionD || null,
              optionE: q.optionE || null,
              correctAnswer: q.correctAnswer || null,
              order: q.order,
            }))
          }
        },
        include: { questions: { orderBy: { order: 'asc' } } }
      })
    }

    const autoAnswerCount = parsedQuestions.filter(q => q.correctAnswer).length

    return NextResponse.json({
      success: true,
      bankId: bank.id,
      subjectName: bank.subjectName,
      questionCount: parsedQuestions.length,
      autoAnswerCount,
      preview: parsedQuestions.slice(0, 3)
    })
  } catch (e: any) {
    console.error('parse-word error:', e)
    return NextResponse.json({ error: e.message || 'Server xatoligi' }, { status: 500 })
  }
}
