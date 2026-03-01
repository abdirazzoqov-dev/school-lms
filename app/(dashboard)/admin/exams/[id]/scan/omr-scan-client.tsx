'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ScanLine, Upload, ArrowLeft, CheckCircle2, AlertTriangle,
  Save, Loader2, Users, Zap, Eye, RotateCcw, Sliders,
  QrCode, UserCheck, Camera, CameraOff, Aperture, Info,
  RefreshCw, Video
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { saveExamResult } from '@/app/actions/exam'
import jsQR from 'jsqr'
import { bubbleCentrePX, NUM_OPTIONS, pxOf, BUBBLE_D_MM } from '@/lib/answer-sheet-layout'

interface ExamSubject {
  id: string; subjectName: string; questionCount: number; pointsPerQ: number
  order: number; correctAnswers?: Record<string, string>
}
interface Exam { id: string; title: string; subjects: ExamSubject[] }
interface Student { id: string; user: { fullName: string; avatar: string | null }; class: { name: string } | null }
interface VariantAnswerKey {
  variantId: string; variantName: string
  answerKeys: Record<string, Record<string, string>>
}

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D', 'E'].slice(0, NUM_OPTIONS)
type ScanMode = 'upload' | 'camera'
type Step = 'capture' | 'review'

// ─── QR Reader from ImageData ─────────────────────────────────────────────────
function readQRFromImageData(imageData: ImageData) {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  })
  if (!code) {
    const code2 = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'invertFirst',
    })
    if (!code2) return null
    try { const d = JSON.parse(code2.data); return d.e && d.s ? d : null } catch { return null }
  }
  try { const d = JSON.parse(code.data); return d.e && d.s ? d : null } catch { return null }
}

// ─── QR Reader from File ──────────────────────────────────────────────────────
async function readQRFromFile(file: File) {
  return new Promise<{ e: string; s: string; v?: string } | null>(resolve => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(readQRFromImageData(ctx.getImageData(0, 0, c.width, c.height)))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// ─── OMR Processing ───────────────────────────────────────────────────────────
// Uses shared layout constants from answer-sheet-layout.ts so detected
// bubble positions exactly match the printed answer sheet grid.
async function detectBubbles(
  source: File | HTMLCanvasElement,
  exam: Exam,
  threshold = 128
): Promise<{ answers: Record<string, Record<string, string>>; confidence: number }> {
  return new Promise((resolve, reject) => {
    const A4_W = 794; const A4_H = 1123
    const BUBBLE_R_PX = Math.round(pxOf(BUBBLE_D_MM) / 2) - 1   // inner radius in pixels

    const processCanvas = (srcCanvas: HTMLCanvasElement) => {
      // Normalize to A4 size
      const c = document.createElement('canvas')
      c.width = A4_W; c.height = A4_H
      const ctx = c.getContext('2d')!
      ctx.drawImage(srcCanvas, 0, 0, A4_W, A4_H)

      const imgData = ctx.getImageData(0, 0, A4_W, A4_H)
      const data = imgData.data

      // Grayscale conversion
      const gray = new Uint8Array(A4_W * A4_H)
      for (let i = 0; i < A4_W * A4_H; i++) {
        gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2])
      }

      // Average brightness of a circular region centred at (cx,cy)
      const circleBrightness = (cx: number, cy: number, r: number) => {
        let sum = 0, cnt = 0
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue
            const px = Math.round(cx + dx), py = Math.round(cy + dy)
            if (px < 0 || px >= A4_W || py < 0 || py >= A4_H) continue
            sum += gray[py * A4_W + px]; cnt++
          }
        }
        return cnt > 0 ? sum / cnt : 255
      }

      const answers: Record<string, Record<string, string>> = {}
      let total = 0, filled = 0

      // Iterate subjects in the order they appear on the printed sheet (sorted by order)
      const sortedSubjects = [...exam.subjects].sort((a, b) => a.order - b.order)
      sortedSubjects.forEach((sub, subIdx) => {
        const key = String(sub.order)
        answers[key] = {}
        for (let q = 1; q <= sub.questionCount; q++) {
          // Sample brightness for each option bubble
          const brights = ANSWER_OPTIONS.map((_, optIdx) => {
            const { x, y } = bubbleCentrePX(subIdx, q, optIdx, sub.questionCount)
            return circleBrightness(x, y, BUBBLE_R_PX)
          })
          const minB = Math.min(...brights)
          total++
          // A bubble is "filled" when average brightness drops below threshold
          if (minB < threshold) {
            answers[key][String(q)] = ANSWER_OPTIONS[brights.indexOf(minB)]
            filled++
          }
        }
      })
      resolve({ answers, confidence: total > 0 ? filled / total : 0 })
    }

    if (source instanceof HTMLCanvasElement) {
      processCanvas(source)
    } else {
      const img = new window.Image()
      const url = URL.createObjectURL(source)
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth; c.height = img.naturalHeight
        c.getContext('2d')!.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        processCanvas(c)
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Rasm yuklanmadi')) }
      img.src = url
    }
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OmrScanClient({ exam, students }: { exam: Exam; students: Student[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qrLoopRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [mode, setMode] = useState<ScanMode>('camera')
  const [step, setStep] = useState<Step>('capture')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment')
  const [capturing, setCapturing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [qrDetected, setQrDetected] = useState(false)
  const [variantAK, setVariantAK] = useState<VariantAnswerKey | null>(null)

  const [capturedImage, setCapturedImage] = useState<string | null>(null)  // base64
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [detectedAnswers, setDetectedAnswers] = useState<Record<string, Record<string, string>>>({})
  const [threshold, setThreshold] = useState(120)
  const [manualSearch, setManualSearch] = useState('')

  const totalQ = exam.subjects.reduce((s, sub) => s + sub.questionCount, 0)
  const totalDetected = Object.values(detectedAnswers).reduce((s, sub) => s + Object.keys(sub).length, 0)
  const selectedStudent = students.find(s => s.id === selectedStudentId)
  const filteredStudents = students.filter(s =>
    !manualSearch || s.user.fullName.toLowerCase().includes(manualSearch.toLowerCase())
  )

  // ─── QR auto-detect from jsqr result ───────────────────────────────────────
  const handleQRResult = useCallback(async (qrData: { e: string; s: string; v?: string }) => {
    if (qrData.e !== exam.id) return
    const st = students.find(s => s.id === qrData.s)
    if (!st) return
    if (selectedStudentId === qrData.s && qrDetected) return  // already set

    setSelectedStudentId(qrData.s)
    setQrDetected(true)

    if (qrData.v && !variantAK) {
      try {
        const res = await fetch(`/api/exam-variants/${qrData.v}`)
        if (res.ok) {
          const v = await res.json()
          setVariantAK(v)
        }
      } catch { /* ignore */ }
    }
  }, [exam.id, students, selectedStudentId, qrDetected, variantAK])

  // ─── Camera start ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    // stop existing stream first
    if (qrLoopRef.current) cancelAnimationFrame(qrLoopRef.current)
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setCameraActive(false)
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)

      // QR scan loop
      const scanQR = () => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        if (video.readyState < 2) { qrLoopRef.current = requestAnimationFrame(scanQR); return }
        const c = canvasRef.current
        const ctx = c.getContext('2d')!
        c.width = video.videoWidth; c.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        const imgData = ctx.getImageData(0, 0, c.width, c.height)
        const qr = readQRFromImageData(imgData)
        if (qr) handleQRResult(qr)
        qrLoopRef.current = requestAnimationFrame(scanQR)
      }
      qrLoopRef.current = requestAnimationFrame(scanQR)
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError'
        ? 'Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.'
        : `Kamera ochilmadi: ${err.message}`)
    }
  }, [handleQRResult])

  const stopCamera = useCallback(() => {
    if (qrLoopRef.current) cancelAnimationFrame(qrLoopRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    if (mode === 'camera') startCamera(cameraFacing)
    else stopCamera()
    return () => stopCamera()
  }, [mode]) // eslint-disable-line

  const switchCamera = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment'
    setCameraFacing(next)
    startCamera(next)
  }

  // ─── Capture from camera ────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!videoRef.current) return
    setCapturing(true)
    const video = videoRef.current
    const c = document.createElement('canvas')
    c.width = video.videoWidth; c.height = video.videoHeight
    c.getContext('2d')!.drawImage(video, 0, 0)

    const dataUrl = c.toDataURL('image/jpeg', 0.95)
    setCapturedImage(dataUrl)
    setCapturedCanvas(c)
    stopCamera()
    setCapturing(false)

    // Auto-process
    setProcessing(true)
    try {
      const { answers, confidence } = await detectBubbles(c, exam, threshold)
      setDetectedAnswers(answers)
      setStep('review')
      const filled = Object.values(answers).reduce((s, sub) => s + Object.keys(sub).length, 0)
      toast.success(`${filled}/${totalQ} javob aniqlandi (${(confidence * 100).toFixed(0)}% ishonch)`)
    } catch (e: any) {
      toast.error('Tahlil xatoligi: ' + e.message)
    } finally {
      setProcessing(false)
    }
  }

  // ─── Upload file mode ────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    setCapturedImage(URL.createObjectURL(file))
    setCapturedCanvas(null)

    // QR from file
    const qr = await readQRFromFile(file)
    if (qr) {
      if (qr.e !== exam.id) {
        toast.warning('Bu varaq boshqa imtihonga tegishli!')
      } else {
        await handleQRResult(qr)
      }
    } else {
      toast.info('QR aniqlanmadi — o\'quvchini qo\'lda tanlang')
    }

    // Auto-process OMR
    setProcessing(true)
    try {
      const { answers, confidence } = await detectBubbles(file, exam, threshold)
      setDetectedAnswers(answers)
      setStep('review')
      const filled = Object.values(answers).reduce((s, sub) => s + Object.keys(sub).length, 0)
      toast.success(`${filled}/${totalQ} javob aniqlandi (${(confidence * 100).toFixed(0)}%)`)
    } catch (e: any) {
      toast.error('Tahlil xatoligi: ' + e.message)
    } finally {
      setProcessing(false)
    }
  }

  // ─── Retake / Reset ─────────────────────────────────────────────────────────
  const retake = () => {
    setStep('capture')
    setCapturedImage(null)
    setCapturedCanvas(null)
    setDetectedAnswers({})
    if (mode === 'camera') startCamera(cameraFacing)
  }

  const fullReset = () => {
    retake()
    setSelectedStudentId('')
    setQrDetected(false)
    setVariantAK(null)
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedStudentId) { toast.error("O'quvchi tanlanmagan"); return }
    setSaving(true)
    const result = await saveExamResult({
      examId: exam.id,
      studentId: selectedStudentId,
      answers: detectedAnswers,
      source: 'SCAN',
      variantId: variantAK?.variantId,
    })
    setSaving(false)
    if (result.success) {
      const r = result as any
      toast.success(`✅ ${selectedStudent?.user.fullName}: ${r.totalScore}/${r.totalMax} ball (${r.percentage?.toFixed(1)}%)`)
      fullReset()
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik')
    }
  }

  const updateAnswer = (sk: string, q: string, a: string) =>
    setDetectedAnswers(p => ({ ...p, [sk]: { ...(p[sk] || {}), [q]: a } }))
  const clearAnswer = (sk: string, q: string) =>
    setDetectedAnswers(p => { const n = { ...(p[sk] || {}) }; delete n[q]; return { ...p, [sk]: n } })

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-green-600 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href={`/admin/exams/${exam.id}/results`}><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><ScanLine className="h-7 w-7" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Javoblar Varaqasini Tekshirish</h1>
              <p className="text-cyan-100 mt-0.5 text-sm">{exam.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <QrCode className="h-3 w-3 text-cyan-200" />
                <span className="text-xs text-cyan-200">QR kod orqali o'quvchi avtomatik aniqlanadi</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Mode toggle */}
      {step === 'capture' && (
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'camera' ? 'bg-white dark:bg-slate-700 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="h-4 w-4" /> Kamera (Tavsiya)
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'upload' ? 'bg-white dark:bg-slate-700 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4" /> Fayl yuklash
          </button>
        </div>
      )}

      {/* Main layout: camera/image left, student right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT: Camera / Captured image */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="border-2 overflow-hidden">
            {/* Camera view */}
            {mode === 'camera' && step === 'capture' && (
              <div className="relative bg-black">
                {cameraError ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
                    <CameraOff className="h-14 w-14 text-red-400 opacity-60" />
                    <p className="text-red-400 font-medium">{cameraError}</p>
                    <Button onClick={() => startCamera(cameraFacing)} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" /> Qayta urinib ko'rish
                    </Button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full max-h-[65vh] object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    {/* QR detected overlay */}
                    {qrDetected && selectedStudent && (
                      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 bg-green-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium">
                        <QrCode className="h-4 w-4 shrink-0" />
                        <span>QR: {selectedStudent.user.fullName} — {selectedStudent.class?.name}</span>
                        {variantAK && <Badge className="ml-auto bg-white/20 text-white text-xs">{variantAK.variantName}</Badge>}
                      </div>
                    )}
                    {/* Alignment guide */}
                    <div className="absolute inset-6 border-2 border-white/40 rounded pointer-events-none">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs whitespace-nowrap bg-black/30 px-2 py-0.5 rounded">
                        Titulni ramka ichiga joylashtiring
                      </p>
                    </div>
                    {/* Camera controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                        onClick={switchCamera}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <button
                        onClick={handleCapture}
                        disabled={capturing || processing}
                        className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        {capturing || processing
                          ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                          : <Aperture className="h-7 w-7 text-white" />}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                        onClick={stopCamera}
                      >
                        <CameraOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* File upload mode */}
            {mode === 'upload' && step === 'capture' && (
              <CardContent className="pt-6 pb-6">
                <div
                  className="border-2 border-dashed border-cyan-300 dark:border-cyan-700 rounded-xl p-12 text-center cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto mb-3 text-cyan-500 opacity-70" />
                  <p className="font-semibold text-lg">Skanerlangan titulni yuklang</p>
                  <p className="text-muted-foreground text-sm mt-1">JPG yoki PNG</p>
                  {processing && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-cyan-600">
                      <Loader2 className="h-5 w-5 animate-spin" /> Tahlil qilinmoqda...
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
              </CardContent>
            )}

            {/* Captured/uploaded image + review */}
            {step === 'review' && capturedImage && (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full max-h-[65vh] object-contain bg-gray-900"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                  onClick={retake}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {mode === 'camera' ? 'Qayta suratga olish' : 'Boshqa fayl'}
                </Button>
              </div>
            )}
          </Card>

          {/* Threshold slider */}
          {step === 'capture' && (
            <Card className="border p-3">
              <div className="flex items-center gap-3">
                <Sliders className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm whitespace-nowrap font-medium">Sezgirlik ({threshold})</span>
                <input type="range" min="50" max="200" value={threshold}
                  onChange={e => setThreshold(+e.target.value)} className="flex-1 accent-cyan-500" />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {threshold < 80 ? 'Qattiq' : threshold < 130 ? 'Optimal' : 'Keng'}
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: Student identification + detected answers */}
        <div className="lg:col-span-2 space-y-4">

          {/* Student panel */}
          <Card className={`border-2 transition-all ${qrDetected && selectedStudent ? 'border-green-300 dark:border-green-700' : 'border-slate-200 dark:border-slate-700'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {qrDetected
                  ? <><QrCode className="h-4 w-4 text-green-500" /> QR orqali aniqlandi</>
                  : <><Users className="h-4 w-4 text-orange-500" /> O'quvchini tanlang</>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {qrDetected && selectedStudent ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                  <Avatar className="h-10 w-10 border-2 border-green-400">
                    <AvatarImage src={selectedStudent.user.avatar || ''} />
                    <AvatarFallback className="bg-green-100 text-green-700 font-bold">{selectedStudent.user.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-green-700 dark:text-green-300 truncate">{selectedStudent.user.fullName}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{selectedStudent.class?.name} • Avtomatik aniqlandi</p>
                    {variantAK && (
                      <Badge className="mt-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-0 text-xs">
                        {variantAK.variantName}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setQrDetected(false); setSelectedStudentId('') }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  {mode === 'camera' && !qrDetected && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                      <QrCode className="h-3.5 w-3.5 shrink-0" />
                      Kamera QR kodni avtomatik skanerlaydi...
                    </div>
                  )}
                  <Input
                    placeholder="Qidirish..."
                    value={manualSearch}
                    onChange={e => setManualSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filteredStudents.slice(0, 20).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStudentId(s.id); setQrDetected(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                          selectedStudentId === s.id
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40'
                            : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                        }`}
                      >
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={s.user.avatar || ''} />
                          <AvatarFallback className="text-xs">{s.user.fullName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{s.user.fullName}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">{s.class?.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Detected answers review */}
          {step === 'review' && (
            <Card className="border-2 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-teal-500" />
                    Aniqlangan Javoblar
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-teal-400 text-teal-600">
                    {totalDetected}/{totalQ}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {exam.subjects.map(sub => {
                  const key = String(sub.order)
                  const sAnswers = detectedAnswers[key] || {}
                  const correctKey = variantAK?.answerKeys?.[key] ?? sub.correctAnswers ?? {}
                  return (
                    <div key={sub.id} className="border-2 rounded-xl overflow-hidden">
                      <div className="bg-indigo-600 text-white px-3 py-1.5 flex justify-between text-xs">
                        <span className="font-semibold">{sub.subjectName}</span>
                        <span>{Object.keys(sAnswers).length}/{sub.questionCount}</span>
                      </div>
                      <div className="p-2 grid grid-cols-2 gap-1">
                        {Array.from({ length: sub.questionCount }, (_, i) => i + 1).map(qNum => {
                          const cur = sAnswers[String(qNum)]
                          const correct = correctKey[String(qNum)]
                          const isOk = correct && cur === correct
                          const isWrong = correct && cur && cur !== correct
                          return (
                            <div key={qNum} className="flex items-center gap-0.5">
                              <span className="text-xs font-mono text-muted-foreground w-4 text-right shrink-0">{qNum}.</span>
                              <div className="flex gap-0.5">
                                {ANSWER_OPTIONS.map(opt => (
                                  <button key={opt}
                                    onClick={() => cur === opt ? clearAnswer(key, String(qNum)) : updateAnswer(key, String(qNum), opt)}
                                    className={`h-5 w-5 rounded-full text-[9px] font-bold border transition-all ${
                                      cur === opt
                                        ? isOk ? 'bg-green-500 border-green-500 text-white'
                                          : isWrong ? 'bg-red-500 border-red-500 text-white'
                                          : 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-indigo-400'
                                    }`}
                                  >{opt}</button>
                                ))}
                              </div>
                              {isOk && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 ml-0.5" />}
                              {isWrong && <span className="text-[9px] text-green-600 font-bold shrink-0 ml-0.5">{correct}</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          {step === 'review' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={retake} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                {mode === 'camera' ? 'Qayta suratga olish' : 'Qayta'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !selectedStudentId}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="default"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Natijani Saqlash
              </Button>
            </div>
          )}

          {/* Camera start button (if stopped) */}
          {mode === 'camera' && step === 'capture' && !cameraActive && !cameraError && (
            <Button
              onClick={() => startCamera(cameraFacing)}
              className="w-full bg-cyan-600 hover:bg-cyan-700 h-12"
              size="lg"
            >
              <Video className="h-5 w-5 mr-2" /> Kamerani Yoqish
            </Button>
          )}

          {/* Tips */}
          {step === 'capture' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-sm text-foreground">💡 Maslahatlar:</p>
              <p>• Titulni tekis, yaxshi yoritilgan joyda tutib turing</p>
              <p>• QR kod ko'rinib tursin — o'quvchi avtomatik aniqlanadi</p>
              <p>• Dumaloqchalar aniq ko'rinishi uchun kamerani yaqinroq tuting</p>
              <p>• Noaniq natijalar bo'lsa sezgirlikni sozlang</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
