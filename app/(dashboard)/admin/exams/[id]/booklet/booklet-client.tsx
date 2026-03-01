'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  BookOpen, ArrowLeft, Plus, Printer, Trash2, Shuffle,
  Database, AlertCircle, CheckCircle2, Loader2, FileText,
  ChevronDown, ChevronUp, Eye, Users, UserCheck,
  Search, Save, School
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { generateExamVariant, deleteExamVariant, assignVariantsToStudents, saveManualAssignments } from '@/app/actions/exam-variant'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import type { VariantData } from '@/app/actions/exam-variant'
import QRCode from 'qrcode'
import {
  PAGE_W_MM, PAGE_H_MM, MARGIN_MM, HEADER_H_MM, INSTR_H_MM, SUB_H_MM,
  SUB_HEADER_H_MM, SUB_PAD_V_MM, ROW_H_MM, NUM_COLS, COL_W_MM,
  Q_NUM_W_MM, BUBBLE_D_MM, BUBBLE_GAP_MM, NUM_OPTIONS
} from '@/lib/answer-sheet-layout'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExamSubjectClient {
  id: string; subjectName: string; questionCount: number; pointsPerQ: number
  order: number; questionBankId: string | null
  questionBank: { id: string; subjectName: string; totalCount: number } | null
}
interface ExamVariantClient {
  id: string; variantNum: number; variantName: string
  questionData: VariantData; createdAt: string
  _count: { results: number }
}
interface Student {
  id: string
  user: { fullName: string }
  class: { name: string } | null
}
interface Props {
  exam: {
    id: string; title: string; description: string | null
    date: string | null; duration: number | null
    subjects: ExamSubjectClient[]; variants: ExamVariantClient[]
  }
  questionBanks: { id: string; subjectName: string; totalCount: number }[]
  students: Student[]
  studentVariantMap: Record<string, string>   // studentId → variantId
  schoolName: string
}

// ─── QR helper ────────────────────────────────────────────────────────────────
async function genQR(examId: string, studentId: string, variantId?: string) {
  const payload = JSON.stringify({ e: examId, s: studentId, v: variantId || '' })
  return QRCode.toDataURL(payload, { width: 68, margin: 0, errorCorrectionLevel: 'M' })
}

// ─── Build compact A4 answer sheet HTML (single student) ─────────────────────
function buildAnswerSheetHTML(
  exam: Props['exam'],
  student: Student,
  schoolName: string,
  qrDataUrl: string,
  variantInfo?: { variantName: string } | null
): string {
  const examDate = exam.date
    ? new Date(exam.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '___/___/______'
  const maxScore = exam.subjects.reduce((s, sub) => s + sub.questionCount * sub.pointsPerQ, 0)
  const opts = ['A', 'B', 'C', 'D'].slice(0, NUM_OPTIONS)

  const subjectsHTML = exam.subjects.map((sub, sIdx) => {
    const qCount = sub.questionCount
    const rowsPerCol = Math.ceil(qCount / NUM_COLS)
    const columns = Array.from({ length: NUM_COLS }, (_, colIdx) => {
      const qFrom = colIdx * rowsPerCol + 1
      const qTo   = Math.min(qFrom + rowsPerCol - 1, qCount)
      if (qFrom > qCount) return ''
      const rows = Array.from({ length: qTo - qFrom + 1 }, (_, r) => {
        const localQ = qFrom + r
        const bubblesHTML = opts.map(opt =>
          `<div style="width:${BUBBLE_D_MM}mm;height:${BUBBLE_D_MM}mm;border-radius:50%;border:1.2px solid #c0392b;display:flex;align-items:center;justify-content:center;font-size:4.8pt;font-weight:bold;color:#c0392b;background:#fff;flex-shrink:0;">${opt}</div>`
        ).join(`<div style="width:${BUBBLE_GAP_MM}mm;"></div>`)
        return `<div style="display:flex;align-items:center;height:${ROW_H_MM}mm;gap:0;background:${localQ%2===0?'#fdf5f5':'transparent'};">
          <div style="width:${Q_NUM_W_MM}mm;font-size:5.5pt;text-align:right;font-weight:bold;color:#333;padding-right:1mm;flex-shrink:0;">${localQ}.</div>
          <div style="display:flex;align-items:center;gap:0;">${bubblesHTML}</div>
        </div>`
      }).join('')
      const headerLabels = opts.map(opt => `<div style="width:${BUBBLE_D_MM}mm;text-align:center;font-size:4.5pt;font-weight:bold;color:#c0392b;">${opt}</div>`).join(`<div style="width:${BUBBLE_GAP_MM}mm;"></div>`)
      return `<div style="flex:1;padding:0 0.5mm;">
        <div style="display:flex;align-items:center;height:4mm;margin-bottom:0.5mm;">
          <div style="width:${Q_NUM_W_MM}mm;"></div><div style="display:flex;">${headerLabels}</div>
        </div>${rows}
      </div>`
    }).join('')
    return `<div style="margin-bottom:0;height:${SUB_H_MM}mm;box-sizing:border-box;border:1px solid #c0392b;border-radius:1.5mm;overflow:hidden;">
      <div style="background:#c0392b;color:#fff;padding:0 2.5mm;height:${SUB_HEADER_H_MM}mm;display:flex;align-items:center;justify-content:space-between;font-weight:bold;font-size:7pt;flex-shrink:0;">
        <span style="font-size:7.5pt;">${sIdx+1}. ${sub.subjectName.toUpperCase()}</span>
        <span style="font-size:6.5pt;opacity:0.9;">${qCount} × ${sub.pointsPerQ} = <strong>${qCount*sub.pointsPerQ}</strong></span>
      </div>
      <div style="display:flex;padding:${SUB_PAD_V_MM}mm 1mm;gap:0;height:${SUB_H_MM-SUB_HEADER_H_MM}mm;box-sizing:border-box;">${columns}</div>
    </div>`
  }).join(`<div style="height:1.5mm;"></div>`)

  return `<div style="width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;padding:${MARGIN_MM}mm;font-family:Arial,Helvetica,sans-serif;font-size:8pt;box-sizing:border-box;position:relative;page-break-after:always;background:white;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="position:absolute;top:0;right:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="position:absolute;bottom:0;left:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="position:absolute;bottom:0;right:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="height:${HEADER_H_MM}mm;display:flex;flex-direction:column;justify-content:space-between;margin-bottom:1mm;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div style="flex:1;">
          <div style="font-size:12pt;font-weight:bold;color:#c0392b;letter-spacing:0.5px;line-height:1;">JAVOBLAR VARAQASI</div>
          <div style="font-size:6.5pt;color:#666;margin-top:0.8mm;">${schoolName}</div>
          ${variantInfo ? `<div style="margin-top:1.5mm;display:inline-block;padding:0.8mm 3mm;background:#c0392b;color:#fff;border-radius:2mm;font-size:8pt;font-weight:bold;letter-spacing:1px;">${variantInfo.variantName.toUpperCase()}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.5mm;margin-left:2mm;">
          <img src="${qrDataUrl}" width="18mm" height="18mm" style="display:block;border:1px solid #ddd;" alt="QR"/>
          <div style="font-size:5pt;color:#888;font-family:monospace;text-align:center;line-height:1.2;">${student.id.slice(-8).toUpperCase()}<br/><span style="color:#c0392b;font-weight:bold;">SCAN</span></div>
        </div>
      </div>
      <div style="display:flex;gap:3mm;align-items:center;border:1.5px solid #c0392b;border-radius:1.5mm;padding:1.5mm 2.5mm;background:#fff9f9;font-size:7pt;">
        <div style="flex:2;display:flex;align-items:center;gap:1.5mm;">
          <span style="color:#888;white-space:nowrap;font-weight:bold;">F.I.O:</span>
          <span style="font-size:8.5pt;font-weight:bold;border-bottom:1px solid #333;flex:1;padding-bottom:1px;">${student.user.fullName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1.5mm;">
          <span style="color:#888;font-weight:bold;">Sinf:</span>
          <span style="font-size:8.5pt;font-weight:bold;">${student.class?.name||'—'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1.5mm;">
          <span style="color:#888;font-weight:bold;">Sana:</span>
          <span style="font-size:7.5pt;font-weight:bold;">${examDate}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1mm;border-left:1px solid #f0c0c0;padding-left:2mm;">
          <span style="color:#888;font-weight:bold;">Imzo:</span>
          <span style="display:inline-block;width:18mm;border-bottom:1px solid #333;">&nbsp;</span>
        </div>
      </div>
    </div>
    <div style="background:#fff8e1;border:1px solid #ffc107;padding:1mm 2.5mm;border-radius:1.5mm;font-size:6pt;margin-bottom:1.5mm;height:${INSTR_H_MM}mm;box-sizing:border-box;display:flex;align-items:center;">
      <strong>⚠ DIQQAT:</strong>&nbsp;Har bir savolga faqat <strong>BITTA</strong> variantni to'liq bo'yab belgilang (A, B, C yoki D). Maks. ball: <strong>${maxScore}</strong>
    </div>
    <div style="display:flex;flex-direction:column;gap:1.5mm;">${subjectsHTML}</div>
    <div style="position:absolute;bottom:${MARGIN_MM}mm;left:${MARGIN_MM}mm;right:${MARGIN_MM}mm;border-top:1.5px dashed #c0392b;padding-top:1.5mm;display:flex;justify-content:space-between;font-size:6.5pt;color:#555;">
      <span>Tekshiruvchi: ___________________</span>
      <span style="font-weight:bold;">Ball: _______ / ${maxScore}</span>
      <span>Foiz: _______ %</span>
      <span>Baho: _______</span>
    </div>
  </div>`
}

// ─── Build student booklet HTML (per student, shows their randomized questions) ──
function buildStudentBookletHTML(
  exam: Props['exam'],
  student: Student,
  variant: ExamVariantClient,
  examDate: string
): string {
  const data = variant.questionData
  const totalQ = data.subjects.reduce((s, sub) => s + (sub.questions?.length || 0), 0)
  const maxScore = data.subjects.reduce((s, sub) => s + (sub.questions?.length || 0) * sub.pointsPerQ, 0)

  const subjectsHTML = data.subjects.map((sub, sIdx) => {
    if (!sub.questions || sub.questions.length === 0) {
      return `<div style="margin-bottom:6mm;page-break-inside:avoid;">
        <div style="background:#1a237e;color:#fff;padding:2mm 4mm;font-weight:bold;font-size:10pt;border-radius:2mm 2mm 0 0;">
          ${sIdx+1}. ${sub.subjectName}
        </div>
        <div style="border:1px solid #1a237e;border-top:none;padding:4mm;color:#888;font-style:italic;border-radius:0 0 2mm 2mm;">
          Bu fan uchun savollar bazasi ulanmagan.
        </div>
      </div>`
    }
    const questionsHTML = sub.questions.map((q, qIdx) => `
      <div style="margin-bottom:4mm;page-break-inside:avoid;">
        <div style="font-weight:bold;font-size:9.5pt;margin-bottom:1.5mm;">
          <span style="color:#1a237e;margin-right:2mm;">${qIdx+1}.</span>${q.text}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1mm 4mm;padding-left:5mm;">
          <div style="font-size:9pt;"><span style="font-weight:bold;color:#555;">A)</span> ${q.optionA}</div>
          <div style="font-size:9pt;"><span style="font-weight:bold;color:#555;">B)</span> ${q.optionB}</div>
          ${q.optionC ? `<div style="font-size:9pt;"><span style="font-weight:bold;color:#555;">C)</span> ${q.optionC}</div>` : ''}
          ${q.optionD ? `<div style="font-size:9pt;"><span style="font-weight:bold;color:#555;">D)</span> ${q.optionD}</div>` : ''}
        </div>
      </div>`).join('')

    return `<div style="margin-bottom:5mm;">
      <div style="background:#1a237e;color:#fff;padding:2mm 4mm;font-weight:bold;font-size:10pt;border-radius:2mm 2mm 0 0;display:flex;justify-content:space-between;align-items:center;">
        <span>${sIdx+1}. ${sub.subjectName}</span>
        <span style="font-size:8pt;opacity:0.85;">${sub.questions.length} savol × ${sub.pointsPerQ} ball</span>
      </div>
      <div style="border:1px solid #1a237e;border-top:none;padding:4mm;border-radius:0 0 2mm 2mm;">${questionsHTML}</div>
    </div>`
  }).join('')

  return `<div style="padding:12mm;font-family:Arial,sans-serif;page-break-after:always;">
    <div style="text-align:center;border-bottom:3px solid #1a237e;padding-bottom:4mm;margin-bottom:5mm;">
      <div style="font-size:15pt;font-weight:bold;color:#1a237e;text-transform:uppercase;letter-spacing:1px;">SAVOLLAR KITOBCHASI</div>
      <div style="font-size:11pt;font-weight:bold;margin-top:2mm;">${exam.title}</div>
      <div style="font-size:9pt;color:#555;margin-top:1mm;">Sana: <strong>${examDate}</strong>${exam.duration?` &nbsp;|&nbsp; Vaqt: <strong>${exam.duration} daqiqa</strong>`:''} &nbsp;|&nbsp; Savollar: <strong>${totalQ} ta</strong> &nbsp;|&nbsp; Maks. ball: <strong>${maxScore}</strong></div>
      <div style="display:inline-block;margin-top:2mm;padding:1.5mm 6mm;background:#1a237e;color:#fff;border-radius:4mm;font-size:11pt;font-weight:bold;letter-spacing:2px;">${variant.variantName.toUpperCase()}</div>
    </div>
    <div style="display:flex;gap:6mm;margin-bottom:5mm;padding:3mm;border:1.5px solid #1a237e;border-radius:2mm;background:#f5f7ff;">
      <div style="flex:2;">
        <span style="font-size:8.5pt;color:#555;">F.I.O: </span>
        <span style="font-weight:bold;font-size:10pt;">${student.user.fullName}</span>
      </div>
      <div><span style="font-size:8.5pt;color:#555;">Sinf: </span><strong>${student.class?.name||'—'}</strong></div>
    </div>
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:2mm 3mm;border-radius:2mm;font-size:8pt;margin-bottom:5mm;">
      <strong>⚠ KO'RSATMA:</strong> Javoblarni faqat <strong>JAVOBLAR VARAQASIGA</strong> belgilang. Variant: <strong>${variant.variantName}</strong>
    </div>
    ${subjectsHTML}
  </div>`
}

// ─── Link bank to subject ─────────────────────────────────────────────────────
async function linkBankToSubject(subjectId: string, bankId: string | null) {
  const res = await fetch(`/api/exam-subjects/${subjectId}/link-bank`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionBankId: bankId }),
  })
  return res.ok
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BookletClient({ exam, questionBanks, students, studentVariantMap, schoolName }: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linkingSubjectId, setLinkingSubjectId] = useState<string | null>(null)
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null)
  const [variantCount, setVariantCount] = useState('4')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterVariantId, setFilterVariantId] = useState('all')
  const [filterClass, setFilterClass] = useState('all')
  const [printingQRs, setPrintingQRs] = useState(false)
  const [printingStudentId, setPrintingStudentId] = useState<string | null>(null)
  // Editable local assignments — tracks unsaved changes
  const [localVariantMap, setLocalVariantMap] = useState<Record<string, string>>(studentVariantMap)
  const [pendingMap, setPendingMap] = useState<Record<string, string>>(studentVariantMap)
  const [localVariants, setLocalVariants] = useState<ExamVariantClient[]>(exam.variants)
  // For bulk class assignment
  const [classAssignVariantId, setClassAssignVariantId] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('all')

  // Variant lookup map by id
  const variantById = useMemo(() => {
    const m: Record<string, ExamVariantClient> = {}
    for (const v of localVariants) m[v.id] = v
    return m
  }, [localVariants])

  // All unique class names
  const allClasses = useMemo(() =>
    Array.from(new Set(students.map(s => s.class?.name).filter(Boolean) as string[])).sort()
  , [students])

  // Filtered students for the table
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      const vId = pendingMap[s.id]
      const matchesVariant = filterVariantId === 'all'
        || (filterVariantId === 'unassigned' && !vId)
        || vId === filterVariantId
      const matchesClass = filterClass === 'all' || s.class?.name === filterClass
      return matchesSearch && matchesVariant && matchesClass
    })
  }, [students, searchQuery, filterVariantId, filterClass, pendingMap])

  // Group students by variant (uses saved localVariantMap for print purposes)
  const studentsByVariant = useMemo(() => {
    const groups: Record<string, Student[]> = {}
    for (const v of localVariants) groups[v.id] = []
    for (const s of students) {
      const vId = localVariantMap[s.id]
      if (vId && groups[vId]) groups[vId].push(s)
    }
    return groups
  }, [students, localVariantMap, localVariants])

  const assignedCount = useMemo(() =>
    students.filter(s => localVariantMap[s.id]).length, [students, localVariantMap])

  const pendingCount = useMemo(() =>
    students.filter(s => pendingMap[s.id]).length, [students, pendingMap])

  const hasPendingChanges = useMemo(() =>
    JSON.stringify(pendingMap) !== JSON.stringify(localVariantMap)
  , [pendingMap, localVariantMap])

  // Change a single student's variant in the pending map
  const setPendingVariant = (studentId: string, variantId: string) => {
    setPendingMap(prev => ({ ...prev, [studentId]: variantId }))
  }

  // Assign a variant to all students in a class (pending only)
  const handleClassAssign = () => {
    if (!classAssignVariantId) { toast.error('Variant tanlang'); return }
    const targetClass = selectedClass === 'all' ? null : selectedClass
    const updates: Record<string, string> = {}
    for (const s of students) {
      if (!targetClass || s.class?.name === targetClass) {
        updates[s.id] = classAssignVariantId
      }
    }
    setPendingMap(prev => ({ ...prev, ...updates }))
    const count = Object.keys(updates).length
    toast.success(`${count} ta o'quvchiga ${variantById[classAssignVariantId]?.variantName} tayinlandi (saqlanmagan)`)
  }

  // Save pending changes to DB
  const handleSavePending = async () => {
    const changed = Object.entries(pendingMap).filter(([sid, vid]) => localVariantMap[sid] !== vid)
    if (changed.length === 0) { toast.info('O\'zgarish yo\'q'); return }
    setSaving(true)
    const result = await saveManualAssignments(exam.id, changed.map(([studentId, variantId]) => ({ studentId, variantId })))
    setSaving(false)
    if (result.success) {
      setLocalVariantMap({ ...pendingMap })
      toast.success(`${result.savedCount} ta tayinlash saqlandi`)
      router.refresh()
    } else {
      toast.error('Saqlashda xatolik')
    }
  }

  // Print booklet + answer sheet for ONE student
  const handlePrintOneStudent = useCallback(async (student: Student) => {
    const vId = localVariantMap[student.id]
    const variant = vId ? variantById[vId] : null
    if (!variant) { toast.error('Bu o\'quvchiga variant tayinlanmagan'); return }

    const examDate = exam.date
      ? new Date(exam.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '___/___/______'

    const hasQ = variant.questionData.subjects.some(s => s.questions && s.questions.length > 0)

    setPrintingStudentId(student.id)
    try {
      const qr = await genQR(exam.id, student.id, vId)
      const bookletPage = hasQ ? buildStudentBookletHTML(exam, student, variant, examDate) : ''
      const answerPage = buildAnswerSheetHTML(exam as any, student, schoolName, qr, variant)

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>${exam.title} — ${student.user.fullName}</title>
        <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:white;}
        @page{size:A4;margin:0;}@media print{body{padding:0;}}</style>
      </head><body>${bookletPage}${answerPage}
      <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
      </body></html>`

      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) { toast.error('Pop-up bloker yoqilgan. O\'chiring.'); return }
      win.document.write(html); win.document.close()
    } catch {
      toast.error('Chop etishda xatolik')
    } finally {
      setPrintingStudentId(null)
    }
  }, [localVariantMap, variantById, exam, schoolName])

  const handleGenerateSingle = async () => {
    setGenerating(true)
    const result = await generateExamVariant(exam.id)
    setGenerating(false)
    if (result.success) {
      toast.success(`${result.variantName} yaratildi!`)
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik')
    }
  }

  const handleAssignVariants = async () => {
    const n = parseInt(variantCount)
    if (isNaN(n) || n < 1 || n > 20) { toast.error('1–20 orasida son kiriting'); return }
    if (students.length === 0) { toast.error('O\'quvchilar topilmadi'); return }

    setAssigning(true)
    const result = await assignVariantsToStudents(exam.id, n, students.map(s => s.id))
    setAssigning(false)

    if (result.success) {
      toast.success(`${n} ta variant yaratildi, ${result.assignedCount} ta o'quvchiga tayinlandi!`)
      router.refresh()
    } else {
      toast.error('error' in result ? result.error : 'Xatolik yuz berdi')
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    const result = await deleteExamVariant(variantId)
    if (result.success) { toast.success("Variant o'chirildi"); router.refresh() }
    else toast.error("O'chirishda xatolik")
  }

  const handleLinkBank = async (subjectId: string, bankId: string) => {
    setLinkingSubjectId(subjectId)
    const ok = await linkBankToSubject(subjectId, bankId === 'none' ? null : bankId)
    setLinkingSubjectId(null)
    if (ok) { toast.success('Baza ulandi'); router.refresh() }
    else toast.error('Ulanishda xatolik')
  }

  // Print booklets for a specific variant (all students assigned to it)
  const handlePrintVariantBooklets = useCallback((variantId: string) => {
    const variant = variantById[variantId]
    if (!variant) return
    const variantStudents = studentsByVariant[variantId] || []
    if (variantStudents.length === 0) { toast.error('Bu variantga o\'quvchi tayinlanmagan'); return }

    const examDate = exam.date
      ? new Date(exam.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '___/___/______'

    const pages = variantStudents.map(s => buildStudentBookletHTML(exam, s, variant, examDate)).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>${exam.title} — ${variant.variantName} kitobchalari</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:white;color:#111;}
      @page{size:A4;margin:0;}@media print{body{padding:0;}}</style>
    </head><body>${pages}<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script></body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast.error('Pop-up bloker yoqilgan. O\'chiring.'); return }
    win.document.write(html); win.document.close()
  }, [variantById, studentsByVariant, exam])

  // Print answer sheets for a specific variant's students
  const handlePrintVariantAnswerSheets = useCallback(async (variantId: string) => {
    const variant = variantById[variantId]
    if (!variant) return
    const variantStudents = studentsByVariant[variantId] || []
    if (variantStudents.length === 0) { toast.error('Bu variantga o\'quvchi tayinlanmagan'); return }

    setPrintingQRs(true)
    toast.info(`${variantStudents.length} ta QR kod yaratilmoqda...`)

    try {
      const pages = await Promise.all(variantStudents.map(async s => {
        const qr = await genQR(exam.id, s.id, variantId)
        return buildAnswerSheetHTML(exam as any, s, schoolName, qr, variant)
      }))

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>${exam.title} — ${variant.variantName} titullari</title>
        <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:white;}
        @page{size:A4;margin:0;}@media print{body{padding:0;}}</style>
      </head><body>${pages.join('')}<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script></body></html>`

      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) { toast.error('Pop-up bloker yoqilgan'); return }
      win.document.write(html); win.document.close()
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setPrintingQRs(false)
    }
  }, [variantById, studentsByVariant, exam, schoolName])

  // Print ALL answer sheets (every student, their assigned variant)
  const handlePrintAllAnswerSheets = useCallback(async () => {
    const assigned = students.filter(s => localVariantMap[s.id])
    if (assigned.length === 0) { toast.error('Hali hech kimga variant tayinlanmagan'); return }

    setPrintingQRs(true)
    toast.info(`${assigned.length} ta QR kod yaratilmoqda...`)

    try {
      const pages = await Promise.all(assigned.map(async s => {
        const vId = localVariantMap[s.id]
        const variant = variantById[vId]
        const qr = await genQR(exam.id, s.id, vId)
        return buildAnswerSheetHTML(exam as any, s, schoolName, qr, variant || null)
      }))

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>${exam.title} — Barcha titullar</title>
        <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:white;}
        @page{size:A4;margin:0;}@media print{body{padding:0;}}</style>
      </head><body>${pages.join('')}<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script></body></html>`

      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) { toast.error('Pop-up bloker yoqilgan'); return }
      win.document.write(html); win.document.close()
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setPrintingQRs(false)
    }
  }, [students, localVariantMap, variantById, exam, schoolName])

  const allSubjectsLinked = exam.subjects.every(s => s.questionBankId)
  const totalQuestions = exam.subjects.reduce((s, sub) => s + sub.questionCount, 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href={`/admin/exams/${exam.id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Savollar Kitobchasi</h1>
                <p className="text-blue-100 mt-0.5">{exam.title}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-white/20 text-white text-xs">{exam.subjects.length} fan</Badge>
                  <Badge className="bg-white/20 text-white text-xs">{totalQuestions} savol</Badge>
                  <Badge className="bg-white/20 text-white text-xs">{localVariants.length} variant</Badge>
                  <Badge className="bg-white/20 text-white text-xs">{students.length} o'quvchi</Badge>
                  {assignedCount > 0 && (
                    <Badge className="bg-green-400/30 text-white text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />{assignedCount} tayinlangan
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {assignedCount > 0 && (
              <Button
                onClick={handlePrintAllAnswerSheets}
                disabled={printingQRs}
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
              >
                {printingQRs
                  ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> QR yaratilmoqda...</>
                  : <><Printer className="h-5 w-5 mr-2" /> Barcha Titullar ({assignedCount})</>}
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Step 1: Link banks */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">1-QADAM</span>
                Fanlarga Savollar Bazasini Ulash
              </CardTitle>
              <CardDescription className="mt-1">Har bir fanga savollar bazasini ulang</CardDescription>
            </div>
            {allSubjectsLinked && (
              <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Barcha fanlar ulangan
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {exam.subjects.map(sub => (
            <div key={sub.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              sub.questionBankId
                ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10'
                : 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10'
            }`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {sub.questionBankId
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  : <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />}
                <div>
                  <p className="font-semibold">{sub.subjectName}</p>
                  <p className="text-xs text-muted-foreground">{sub.questionCount} savol • {sub.pointsPerQ} ball/savol</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {sub.questionBank && (
                  <Badge variant="outline" className="text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 whitespace-nowrap">
                    <Database className="h-3 w-3 mr-1" />{sub.questionBank.subjectName} ({sub.questionBank.totalCount} ta)
                  </Badge>
                )}
                <Select value={sub.questionBankId || 'none'} onValueChange={v => handleLinkBank(sub.id, v)} disabled={linkingSubjectId === sub.id}>
                  <SelectTrigger className="w-52 h-8 text-xs">
                    {linkingSubjectId === sub.id
                      ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Yuklanmoqda...</>
                      : <SelectValue placeholder="Baza tanlang..." />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground">— Baza ulanmagan —</span></SelectItem>
                    {questionBanks.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.subjectName} ({b.totalCount} savol)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Step 2: Generate variants + assign to students */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">2-QADAM</span>
            Variantlarni Yaratib O'quvchilarga Tayinlash
          </CardTitle>
          <CardDescription>
            Har bir o'quvchiga noyob savollar tartibi bilan variant tayinlanadi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex-1">
              <Label className="text-sm font-semibold mb-1.5 block">Nechta variant?</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {students.length} ta o'quvchi uchun — variant soni ko'p bo'lsa, har bir o'quvchi yanada noyob tartiblami oladi
              </p>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 4, 5, 6].map(n => (
                  <Button key={n} size="sm" variant={variantCount === String(n) ? 'default' : 'outline'}
                    className={variantCount === String(n) ? 'bg-indigo-600' : ''}
                    onClick={() => setVariantCount(String(n))}>
                    {n} ta variant
                  </Button>
                ))}
                <Input
                  value={variantCount}
                  onChange={e => setVariantCount(e.target.value)}
                  className="w-20 h-8 text-center"
                  placeholder="4"
                  type="number" min={1} max={20}
                />
              </div>
            </div>
            <Button
              onClick={handleAssignVariants}
              disabled={assigning}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
            >
              {assigning
                ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Tayinlanmoqda...</>
                : <><Shuffle className="h-5 w-5 mr-2" /> Variant Yaratib Tayinlash</>}
            </Button>
          </div>

          {assignedCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300">
                <strong>{assignedCount}</strong> ta o'quvchiga variant tayinlangan
                {students.length - assignedCount > 0 && ` • ${students.length - assignedCount} ta tayinlanmagan`}
              </span>
            </div>
          )}

          {/* One-shot single variant generation */}
          <Button
            onClick={handleGenerateSingle}
            disabled={generating}
            variant="outline"
            size="sm"
            className="w-full border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
          >
            {generating
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yaratilmoqda...</>
              : <><Plus className="h-4 w-4 mr-2" /> Qo'shimcha bitta variant yaratish</>}
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Variants with per-variant print buttons */}
      {localVariants.length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">3-QADAM</span>
                Variantlarni Chop Etish
              </CardTitle>
              <Badge variant="outline">{localVariants.length} ta variant</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {localVariants.map(variant => {
              const data = variant.questionData
              const hasQ = data.subjects.some(s => s.questions && s.questions.length > 0)
              const totalQ = data.subjects.reduce((s, sub) => s + (sub.questions?.length || 0), 0)
              const vStudents = studentsByVariant[variant.id] || []
              const isExpanded = expandedVariant === variant.id

              return (
                <div key={variant.id} className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {variant.variantNum}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{variant.variantName}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{new Date(variant.createdAt).toLocaleDateString('uz-UZ')}</span>
                          {hasQ && <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 dark:text-blue-400">{totalQ} ta savol matni</Badge>}
                          <Badge variant="outline" className={`text-xs ${vStudents.length > 0 ? 'border-green-300 text-green-600' : 'border-slate-300 text-muted-foreground'}`}>
                            <Users className="h-3 w-3 mr-1" />{vStudents.length} ta o'quvchi
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {hasQ && (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => handlePrintVariantBooklets(variant.id)}
                          disabled={vStudents.length === 0}>
                          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                          Kitobchalar ({vStudents.length})
                        </Button>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => handlePrintVariantAnswerSheets(variant.id)}
                        disabled={printingQRs || vStudents.length === 0}>
                        {printingQRs
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> QR...</>
                          : <><Printer className="h-3.5 w-3.5 mr-1.5" /> Titullar ({vStudents.length})</>}
                      </Button>
                      {hasQ && (
                        <Button size="sm" variant="outline"
                          onClick={() => setExpandedVariant(isExpanded ? null : variant.id)}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <><Eye className="h-3.5 w-3.5 mr-1" />Ko'rish</>}
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{variant.variantName}ni o'chirish</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu variant va unga bog'liq {vStudents.length} ta o'quvchi tayinlanishi o'chiriladi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteVariant(variant.id)} className="bg-red-600 hover:bg-red-700">O'chirish</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Preview questions */}
                  {isExpanded && hasQ && (
                    <div className="border-t p-4 space-y-4 bg-slate-50 dark:bg-slate-900/30 max-h-[400px] overflow-y-auto">
                      {data.subjects.map((sub, sIdx) => (
                        <div key={sub.subjectId}>
                          <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-300 mb-2">
                            {sIdx+1}. {sub.subjectName} ({sub.questions?.length || 0} savol)
                          </h4>
                          <div className="space-y-1.5">
                            {(sub.questions || []).slice(0, 3).map((q, qIdx) => (
                              <div key={q.id} className="text-sm p-2 bg-card rounded-lg border">
                                <span className="font-mono text-xs text-muted-foreground mr-2">{qIdx+1}.</span>
                                <span>{q.text}</span>
                                <div className="mt-1 flex flex-wrap gap-1.5 pl-5">
                                  {['A','B','C','D'].map(l => {
                                    const opt = l==='A'?q.optionA:l==='B'?q.optionB:l==='C'?q.optionC:q.optionD
                                    if (!opt) return null
                                    return (
                                      <span key={l} className={`text-xs px-1.5 py-0.5 rounded-full ${q.correctAnswer===l?'bg-green-100 dark:bg-green-900/40 text-green-700 font-bold':'bg-slate-100 dark:bg-slate-800 text-muted-foreground'}`}>
                                        {l}) {opt}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                            {(sub.questions?.length || 0) > 3 && (
                              <p className="text-xs text-muted-foreground text-center py-1">...va yana {(sub.questions?.length||0)-3} ta savol</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Interactive student-variant assignment */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">4-QADAM</span>
                O'quvchilar va Variant Tayinlanishi
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 ml-5">
                Sinf yoki individual tarzda variant tayinlang, keyin <strong>Saqlash</strong> tugmasini bosing
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasPendingChanges && (
                <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 animate-pulse">
                  Saqlanmagan o'zgarishlar
                </Badge>
              )}
              <Button
                onClick={handleSavePending}
                disabled={saving || !hasPendingChanges}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {saving
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saqlanmoqda...</>
                  : <><Save className="h-3.5 w-3.5 mr-1.5" /> Saqlash ({pendingCount} ta)</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">

          {/* Bulk class assignment strip */}
          {localVariants.length > 0 && (
            <div className="flex flex-wrap items-end gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                <School className="h-4 w-4" /> Sinf kesimida tayinlash:
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-8 w-36 text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Sinf tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha sinflar</SelectItem>
                  {allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={classAssignVariantId} onValueChange={setClassAssignVariantId}>
                <SelectTrigger className="h-8 w-36 text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Variant tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {localVariants.map(v => <SelectItem key={v.id} value={v.id}>{v.variantName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleClassAssign}
                disabled={!classAssignVariantId}
                className="bg-indigo-600 hover:bg-indigo-700 h-8">
                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                Tayinlash ({selectedClass === 'all'
                  ? students.length
                  : students.filter(s => s.class?.name === selectedClass).length} ta)
              </Button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ism qidirish..." className="pl-7 h-8 w-44 text-xs" />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Sinf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sinflar</SelectItem>
                {allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterVariantId} onValueChange={setFilterVariantId}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Variant filtri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha</SelectItem>
                {localVariants.map(v => <SelectItem key={v.id} value={v.id}>{v.variantName}</SelectItem>)}
                <SelectItem value="unassigned">Tayinlanmagan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b z-10">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs w-8">#</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">F.I.O</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs w-16">Sinf</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs w-44">Tayinlangan Variant</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs w-28">Chop Et</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => {
                    const pendingVId = pendingMap[s.id]
                    const savedVId = localVariantMap[s.id]
                    const isChanged = pendingVId !== savedVId
                    return (
                      <tr key={s.id} className={`border-b last:border-0 transition-colors ${isChanged ? 'bg-amber-50 dark:bg-amber-950/10' : 'hover:bg-muted/20'}`}>
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{idx+1}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{s.user.fullName}</span>
                          {isChanged && <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">●</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{s.class?.name || '—'}</td>
                        <td className="px-3 py-1.5">
                          {localVariants.length > 0 ? (
                            <Select
                              value={pendingVId || 'none'}
                              onValueChange={v => setPendingVariant(s.id, v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className={`h-7 text-xs w-36 ${
                                pendingVId
                                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                                  : 'border-dashed text-muted-foreground'
                              }`}>
                                <SelectValue placeholder="— tanlang —" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none"><span className="text-muted-foreground text-xs">— tayinlanmagan —</span></SelectItem>
                                {localVariants.map(v => (
                                  <SelectItem key={v.id} value={v.id}>
                                    <span className="font-medium">{v.variantName}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Avval variant yarating</span>
                          )}
                        </td>
                        {/* Per-student print button */}
                        <td className="px-3 py-1.5">
                          {localVariantMap[s.id] ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 gap-1"
                              disabled={printingStudentId === s.id}
                              onClick={() => handlePrintOneStudent(s)}
                              title={`${s.user.fullName} — kitobcha + titul chop et`}
                            >
                              {printingStudentId === s.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Printer className="h-3.5 w-3.5" />}
                              <span>Chop</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-2">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">O'quvchi topilmadi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredStudents.length} ta ko'rsatilmoqda / {students.length} ta jami</span>
              <span>
                <strong className="text-indigo-600 dark:text-indigo-400">{pendingCount}</strong> tayinlangan
                {hasPendingChanges && <span className="text-amber-600 dark:text-amber-400 ml-2">• o'zgarishlar saqlanmagan</span>}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating save button when there are unsaved changes */}
      {hasPendingChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSavePending}
            disabled={saving}
            size="lg"
            className="bg-green-600 hover:bg-green-700 shadow-2xl shadow-green-600/40 rounded-2xl px-6"
          >
            {saving
              ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saqlanmoqda...</>
              : <><Save className="h-5 w-5 mr-2" /> O'zgarishlarni Saqlash</>}
          </Button>
        </div>
      )}

      {/* How-to */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-4 pb-4">
          <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Qanday ishlaydi?
          </h3>
          <ol className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex gap-2"><span className="font-bold shrink-0">1.</span> Har bir fanga savollar bazasini ulang</li>
            <li className="flex gap-2"><span className="font-bold shrink-0">2.</span> "N ta Variant Yaratib Tayinlash" tugmasini bosing — har bir o'quvchiga <strong>noyob savollar tartibi</strong> tayinlanadi</li>
            <li className="flex gap-2"><span className="font-bold shrink-0">3.</span> Har bir variant uchun <strong>Kitobchalar</strong> — o'quvchilarning ismli savollar varaqalarini chop eting</li>
            <li className="flex gap-2"><span className="font-bold shrink-0">4.</span> Har bir variant uchun <strong>Titullar</strong> — o'quvchilarning ismli javob varaqalarini chop eting (QR kodli)</li>
            <li className="flex gap-2"><span className="font-bold shrink-0">5.</span> O'quvchi <strong>o'z kitobchasidan</strong> ishlaydi → titulga belgilaydi → admin skanerlaydi → <strong>platforma o'sha variant kalitida baholaydi</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
