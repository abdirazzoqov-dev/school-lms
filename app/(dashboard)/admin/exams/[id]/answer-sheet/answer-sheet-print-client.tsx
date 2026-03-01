'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Printer, ArrowLeft, FileText,
  Search, CheckSquare, Square, ChevronLeft, ChevronRight,
  Layers, Users, QrCode, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import {
  PAGE_W_MM, PAGE_H_MM,
  MARGIN_MM, HEADER_H_MM, INSTR_H_MM, SUB_H_MM, SUB_HEADER_H_MM,
  SUB_PAD_V_MM, ROW_H_MM, NUM_COLS, COL_W_MM, Q_NUM_W_MM,
  BUBBLE_D_MM, BUBBLE_GAP_MM, NUM_OPTIONS
} from '@/lib/answer-sheet-layout'

interface ExamSubject {
  id: string
  subjectName: string
  questionCount: number
  pointsPerQ: number
  order: number
}

interface Exam {
  id: string
  title: string
  description: string | null
  date: string | null
  duration: number | null
  subjects: ExamSubject[]
}

interface Student {
  id: string
  user: { fullName: string }
  class: { name: string } | null
}

interface Props {
  exam: Exam
  students: Student[]
  schoolName: string
  variant?: { id: string; variantNum: number; variantName: string } | null
  // Per-student variant assignments from booklet page
  studentVariantMap?: Record<string, string>    // studentId → variantId
  variantInfoMap?: Record<string, { id: string; variantNum: number; variantName: string }>
}

const BATCH_OPTIONS = [10, 25, 50, 100, 0]

// ─── QR code payload ──────────────────────────────────────────────────────────
// { e: examId, s: studentId, v: variantId (optional) }
function makeQrPayload(examId: string, studentId: string, variantId?: string): string {
  const payload: Record<string, string> = { e: examId, s: studentId }
  if (variantId) payload.v = variantId
  return JSON.stringify(payload)
}

// ─── Generate QR as base64 PNG data URL ──────────────────────────────────────
async function genQR(examId: string, studentId: string, variantId?: string): Promise<string> {
  return QRCode.toDataURL(makeQrPayload(examId, studentId, variantId), {
    errorCorrectionLevel: 'M',
    width: 120,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

// ─── Compact A4 Answer Sheet HTML ────────────────────────────────────────────
// Layout: 5 subjects × up to 30 questions, all on ONE A4 page
// 5 question-columns per subject, question number + A B C D bubbles per row
function buildAnswerSheetHTML(
  exam: Exam,
  student: Student,
  schoolName: string,
  qrDataUrl: string,
  variantInfo?: { variantNum: number; variantName: string } | null
): string {
  const examDate = exam.date
    ? new Date(exam.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '___/___/______'
  const maxScore = exam.subjects.reduce((s, sub) => s + sub.questionCount * sub.pointsPerQ, 0)
  const opts = ['A', 'B', 'C', 'D'].slice(0, NUM_OPTIONS)

  // ── Build each subject block ──────────────────────────────────────────────
  const subjectsHTML = exam.subjects.map((sub, sIdx) => {
    const qCount = sub.questionCount
    const rowsPerCol = Math.ceil(qCount / NUM_COLS)

    // Build 5 columns, each with `rowsPerCol` question rows
    const columns = Array.from({ length: NUM_COLS }, (_, colIdx) => {
      const qFrom = colIdx * rowsPerCol + 1
      const qTo   = Math.min(qFrom + rowsPerCol - 1, qCount)
      if (qFrom > qCount) return ''

      const rows = Array.from({ length: qTo - qFrom + 1 }, (_, r) => {
        const localQ = qFrom + r
        const bubblesHTML = opts.map(opt =>
          `<div style="
            width:${BUBBLE_D_MM}mm;height:${BUBBLE_D_MM}mm;
            border-radius:50%;
            border:1.2px solid #c0392b;
            display:flex;align-items:center;justify-content:center;
            font-size:4.8pt;font-weight:bold;color:#c0392b;
            background:#fff;flex-shrink:0;
          ">${opt}</div>`
        ).join(`<div style="width:${BUBBLE_GAP_MM}mm;"></div>`)

        return `<div style="
          display:flex;align-items:center;
          height:${ROW_H_MM}mm;
          gap:0;
          background:${localQ % 2 === 0 ? '#fdf5f5' : 'transparent'};
        ">
          <div style="
            width:${Q_NUM_W_MM}mm;font-size:5.5pt;text-align:right;
            font-weight:bold;color:#333;padding-right:1mm;flex-shrink:0;
          ">${localQ}.</div>
          <div style="display:flex;align-items:center;gap:0;">${bubblesHTML}</div>
        </div>`
      }).join('')

      // Column header (A B C D labels)
      const headerLabels = opts.map(opt =>
        `<div style="width:${BUBBLE_D_MM}mm;text-align:center;font-size:4.5pt;font-weight:bold;color:#c0392b;">${opt}</div>`
      ).join(`<div style="width:${BUBBLE_GAP_MM}mm;"></div>`)

      return `<div style="flex:1;padding:0 0.5mm;">
        <div style="display:flex;align-items:center;height:4mm;margin-bottom:0.5mm;">
          <div style="width:${Q_NUM_W_MM}mm;"></div>
          <div style="display:flex;">${headerLabels}</div>
        </div>
        ${rows}
      </div>`
    }).join('')

    return `<div style="
      margin-bottom:0;
      height:${SUB_H_MM}mm;
      box-sizing:border-box;
      border:1px solid #c0392b;
      border-radius:1.5mm;
      overflow:hidden;
    ">
      <!-- Subject header bar -->
      <div style="
        background:#c0392b;color:#fff;
        padding:0 2.5mm;
        height:${SUB_HEADER_H_MM}mm;
        display:flex;align-items:center;justify-content:space-between;
        font-weight:bold;font-size:7pt;
        flex-shrink:0;
      ">
        <span style="font-size:7.5pt;">${sIdx + 1}. ${sub.subjectName.toUpperCase()}</span>
        <span style="font-size:6.5pt;opacity:0.9;">${qCount} savol × ${sub.pointsPerQ} ball = <strong>${qCount * sub.pointsPerQ}</strong></span>
      </div>
      <!-- 5-column question grid -->
      <div style="
        display:flex;
        padding:${SUB_PAD_V_MM}mm 1mm;
        gap:0;
        height:${SUB_H_MM - SUB_HEADER_H_MM}mm;
        box-sizing:border-box;
      ">
        ${columns}
      </div>
    </div>`
  }).join(`<div style="height:1.5mm;"></div>`)

  return `
  <div style="
    width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;
    padding:${MARGIN_MM}mm;
    font-family:Arial,Helvetica,sans-serif;
    font-size:8pt;
    box-sizing:border-box;
    position:relative;
    page-break-after:always;
    background:white;
    overflow:hidden;
  ">
    <!-- Corner alignment marks (solid black squares for OMR) -->
    <div style="position:absolute;top:0;left:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="position:absolute;top:0;right:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="position:absolute;bottom:0;left:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>
    <div style="position:absolute;bottom:0;right:0;width:${MARGIN_MM}mm;height:${MARGIN_MM}mm;background:#000;"></div>

    <!-- ═══ HEADER (${HEADER_H_MM}mm) ═══ -->
    <div style="height:${HEADER_H_MM}mm;display:flex;flex-direction:column;justify-content:space-between;margin-bottom:1mm;">

      <!-- Row 1: Title + QR -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div style="flex:1;">
          <div style="font-size:12pt;font-weight:bold;color:#c0392b;letter-spacing:0.5px;line-height:1;">JAVOBLAR VARAQASI</div>
          <div style="font-size:6.5pt;color:#666;margin-top:0.8mm;">${schoolName}</div>
          ${variantInfo
            ? `<div style="margin-top:1.5mm;display:inline-block;padding:0.8mm 3mm;background:#c0392b;color:#fff;border-radius:2mm;font-size:8pt;font-weight:bold;letter-spacing:1px;">${variantInfo.variantName.toUpperCase()}</div>`
            : ''}
        </div>
        <!-- QR + ID -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.5mm;margin-left:2mm;">
          <img src="${qrDataUrl}" width="18mm" height="18mm" style="display:block;border:1px solid #ddd;" alt="QR"/>
          <div style="font-size:5pt;color:#888;font-family:monospace;text-align:center;line-height:1.2;">
            ${student.id.slice(-8).toUpperCase()}<br/><span style="color:#c0392b;font-weight:bold;">SCAN</span>
          </div>
        </div>
      </div>

      <!-- Row 2: Student info strip -->
      <div style="
        display:flex;gap:3mm;align-items:center;
        border:1.5px solid #c0392b;border-radius:1.5mm;
        padding:1.5mm 2.5mm;
        background:#fff9f9;
        font-size:7pt;
      ">
        <div style="flex:2;display:flex;align-items:center;gap:1.5mm;">
          <span style="color:#888;white-space:nowrap;font-weight:bold;">F.I.O:</span>
          <span style="font-size:8.5pt;font-weight:bold;border-bottom:1px solid #333;flex:1;padding-bottom:1px;">${student.user.fullName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:1.5mm;">
          <span style="color:#888;font-weight:bold;">Sinf:</span>
          <span style="font-size:8.5pt;font-weight:bold;">${student.class?.name || '—'}</span>
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

    <!-- ═══ INSTRUCTIONS (${INSTR_H_MM}mm) ═══ -->
    <div style="
      background:#fff8e1;border:1px solid #ffc107;
      padding:1mm 2.5mm;border-radius:1.5mm;
      font-size:6pt;margin-bottom:1.5mm;
      height:${INSTR_H_MM}mm;box-sizing:border-box;
      display:flex;align-items:center;
    ">
      <strong>⚠ DIQQAT:</strong>&nbsp;Har bir savolga faqat <strong>BITTA</strong> variantni to'liq bo'yab belgilang (A, B, C yoki D).
      Noto'g'ri javobni to'liq bo'yab, to'g'risini belgilang. Maks. ball: <strong>${maxScore}</strong>
    </div>

    <!-- ═══ SUBJECT BLOCKS (${exam.subjects.length} × ${SUB_H_MM}mm) ═══ -->
    <div style="display:flex;flex-direction:column;gap:1.5mm;">
      ${subjectsHTML}
    </div>

    <!-- ═══ FOOTER ═══ -->
    <div style="
      position:absolute;bottom:${MARGIN_MM}mm;left:${MARGIN_MM}mm;right:${MARGIN_MM}mm;
      border-top:1.5px dashed #c0392b;padding-top:1.5mm;
      display:flex;justify-content:space-between;
      font-size:6.5pt;color:#555;
    ">
      <span>Tekshiruvchi: ___________________</span>
      <span style="font-weight:bold;">Ball: _______ / ${maxScore}</span>
      <span>Foiz: _______ %</span>
      <span>Baho: _______</span>
    </div>
  </div>`
}

// ─── Open new window and print ────────────────────────────────────────────────
// variant = shared variant (from URL param); studentVariantMap = per-student assignments
async function printStudents(
  exam: Exam,
  studentsBatch: Student[],
  schoolName: string,
  variant?: { id: string; variantNum: number; variantName: string } | null,
  onProgress?: (done: number, total: number) => void,
  studentVariantMap?: Record<string, string>,
  variantInfoMap?: Record<string, { id: string; variantNum: number; variantName: string }>
) {
  const qrMap: Record<string, string> = {}
  for (let i = 0; i < studentsBatch.length; i++) {
    const s = studentsBatch[i]
    // Per-student variant takes priority over shared variant param
    const effectiveVariantId = studentVariantMap?.[s.id] || variant?.id
    qrMap[s.id] = await genQR(exam.id, s.id, effectiveVariantId)
    onProgress?.(i + 1, studentsBatch.length)
  }

  const sheetsHTML = studentsBatch
    .map(s => {
      const effectiveVariantId = studentVariantMap?.[s.id] || variant?.id
      const effectiveVariant = effectiveVariantId
        ? (variantInfoMap?.[effectiveVariantId] ?? variant ?? null)
        : null
      return buildAnswerSheetHTML(exam, s, schoolName, qrMap[s.id], effectiveVariant)
    })
    .join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${exam.title} — Javoblar varaqalari</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; }
    @page { size: A4; margin: 0; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
${sheetsHTML}
<script>
  window.onload = function() { setTimeout(function(){ window.print(); }, 500); };
<\/script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    toast.error("Brauzer pop-up bloker yoqilgan. O'chiring va qayta urinib ko'ring.")
    return
  }
  win.document.write(html)
  win.document.close()
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AnswerSheetPrintClient({
  exam, students, schoolName, variant,
  studentVariantMap = {}, variantInfoMap = {}
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(students.map(s => s.id)))
  const [filterClass, setFilterClass] = useState('')
  const [search, setSearch] = useState('')
  const [batchSize, setBatchSize] = useState(50)
  const [batchIndex, setBatchIndex] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)

  const classes = Array.from(new Set(students.map(s => s.class?.name).filter(Boolean))) as string[]

  const filtered = students.filter(s => {
    if (filterClass && s.class?.name !== filterClass) return false
    if (search && !s.user.fullName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selected = filtered.filter(s => selectedIds.has(s.id))

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAll = () => setSelectedIds(new Set(filtered.map(s => s.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const effectiveBatch = batchSize === 0 ? selected.length : batchSize
  const totalBatches = effectiveBatch > 0 ? Math.ceil(selected.length / effectiveBatch) : 1
  const safeBatchIdx = Math.min(batchIndex, Math.max(0, totalBatches - 1))
  const currentBatch = selected.slice(safeBatchIdx * effectiveBatch, (safeBatchIdx + 1) * effectiveBatch)

  const handlePrintBatch = async () => {
    if (currentBatch.length === 0) { toast.error("O'quvchi tanlanmagan"); return }
    setGenerating(true)
    setGenProgress(0)
    try {
      await printStudents(exam, currentBatch, schoolName, variant,
        (done, total) => setGenProgress(Math.round((done / total) * 100)),
        studentVariantMap, variantInfoMap)
    } finally {
      setGenerating(false)
      setGenProgress(0)
    }
  }

  const handlePrintAll = async () => {
    if (selected.length === 0) { toast.error("O'quvchi tanlanmagan"); return }
    setGenerating(true)
    setGenProgress(0)
    try {
      await printStudents(exam, selected, schoolName, variant,
        (done, total) => setGenProgress(Math.round((done / total) * 100)),
        studentVariantMap, variantInfoMap)
    } finally {
      setGenerating(false)
      setGenProgress(0)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href={`/admin/exams/${exam.id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Javoblar Varaqalari</h1>
                <p className="text-blue-100 mt-0.5">{exam.title}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <QrCode className="h-3.5 w-3.5 text-blue-200" />
                  <span className="text-xs text-blue-200">Har bir varaqda QR kod — skanerlanganda o'quvchi avtomatik aniqlanadi</span>
                </div>
                {Object.keys(studentVariantMap).length > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-green-400/30 rounded-lg px-2 py-1">
                    <span className="text-xs font-bold text-white">
                      {Object.keys(studentVariantMap).length} ta o'quvchiga individual variant tayinlangan
                    </span>
                  </div>
                )}
                {variant && Object.keys(studentVariantMap).length === 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-2 py-1">
                    <span className="text-xs font-bold text-white">{variant.variantName}</span>
                    <span className="text-xs text-blue-200">— Titul shu variant uchun</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={handlePrintAll}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              disabled={selected.length === 0 || generating}
            >
              {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Printer className="h-5 w-5 mr-2" />}
              Hammasini Chop ({selected.length} ta)
            </Button>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* QR info card */}
      <Card className="border-2 border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-100 dark:bg-teal-900/40 rounded-xl shrink-0">
              <QrCode className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="font-semibold text-teal-700 dark:text-teal-300">QR kod — Avtomatik identifikatsiya</p>
              <p className="text-sm text-teal-600 dark:text-teal-400 mt-0.5">
                Har bir varaqda o'quvchi ID va imtihon ID si kodlangan QR kod chiqariladi.
                Admin varaqni skanerlashi bilanoq tizim o'quvchini <strong>avtomatik aniqlaydi</strong> va natijani bazaga biriktiradi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student selection */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> O'quvchilarni Tanlash
            </CardTitle>
            <Badge variant="outline" className="text-indigo-600 border-indigo-300 dark:border-indigo-700">
              {selected.length} / {students.length} tanlandi
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Ism bo'yicha..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterClass || 'ALL'} onValueChange={v => setFilterClass(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sinf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barcha sinflar</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-1.5" /> Barchasini belgilash
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              <Square className="h-4 w-4 mr-1.5" /> Belgini olib tashlash
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
            {filtered.map(s => (
                <button
                key={s.id}
                onClick={() => toggleStudent(s.id)}
                className={`p-2.5 rounded-lg border-2 text-left transition-all text-xs ${
                  selectedIds.has(s.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="font-medium truncate">{s.user.fullName}</div>
                <div className="text-muted-foreground mt-0.5">{s.class?.name || '—'}</div>
                {studentVariantMap[s.id] && variantInfoMap[studentVariantMap[s.id]] && (
                  <div className="mt-1 text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    {variantInfoMap[studentVariantMap[s.id]].variantName}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
            <span>{filtered.length} ta ko'rsatilmoqda</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selected.length} ta tanlandi</span>
          </div>
        </CardContent>
      </Card>

      {/* Batch printing */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" /> Partiyalab Chop Etish
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {selected.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">O'quvchilar tanlanmagan</p>
          ) : (
            <>
              {/* QR generation progress */}
              {generating && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      QR kodlar yaratilmoqda... {genProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${genProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Batch size */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Partiya hajmi:</span>
                <div className="flex gap-1.5">
                  {BATCH_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setBatchSize(opt); setBatchIndex(0) }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                        batchSize === opt
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {opt === 0 ? 'Barchasi' : opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch navigator */}
              {totalBatches > 1 && (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
                  <Button variant="outline" size="sm" onClick={() => setBatchIndex(i => Math.max(0, i - 1))} disabled={safeBatchIdx === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <p className="font-bold text-lg">{safeBatchIdx + 1} / {totalBatches} — Partiya</p>
                    <p className="text-sm text-muted-foreground">
                      {safeBatchIdx * effectiveBatch + 1}–{Math.min((safeBatchIdx + 1) * effectiveBatch, selected.length)} o'quvchi
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2 justify-center max-w-sm mx-auto">
                      {currentBatch.slice(0, 8).map(s => (
                        <span key={s.id} className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                          {s.user.fullName.split(' ')[0]}
                        </span>
                      ))}
                      {currentBatch.length > 8 && (
                        <span className="text-xs text-muted-foreground px-1">+{currentBatch.length - 8} ta</span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setBatchIndex(i => Math.min(totalBatches - 1, i + 1))} disabled={safeBatchIdx === totalBatches - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Print buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handlePrintBatch}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
                  disabled={currentBatch.length === 0 || generating}
                >
                  {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Printer className="h-5 w-5 mr-2" />}
                  {batchSize === 0 || totalBatches === 1
                    ? `Barchasini Chop Etish (${currentBatch.length} ta)`
                    : `${safeBatchIdx + 1}-Partiyani Chop Et (${currentBatch.length} ta)`}
                </Button>
                {totalBatches > 1 && (
                  <Button onClick={handlePrintAll} variant="outline" className="h-12 border-2" disabled={generating}>
                    <Printer className="h-5 w-5 mr-2" /> Hammasini bir yo'la ({selected.length})
                  </Button>
                )}
              </div>

              {totalBatches > 1 && (
                <div className="flex gap-1">
                  {Array.from({ length: totalBatches }).map((_, idx) => (
                    <button key={idx} onClick={() => setBatchIndex(idx)}
                      className={`h-2 flex-1 min-w-[8px] rounded-full transition-all ${
                        idx === safeBatchIdx ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700 hover:bg-indigo-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center pt-1">
                💡 Yangi oyna ochiladi va avtomatik print dialog ko'rinadi. Pop-up bloker o'chirilgan bo'lsin.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
