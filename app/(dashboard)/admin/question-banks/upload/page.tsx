'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Upload, FileText, ArrowLeft, CheckCircle2, AlertCircle,
  Loader2, Database, BookOpen, Eye, EyeOff, Info
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PreviewQuestion {
  text: string
  optionA: string
  optionB: string
  optionC?: string
  optionD?: string
  order: number
}

interface ParseResult {
  success: boolean
  bankId?: string
  subjectName?: string
  questionCount?: number
  autoAnswerCount?: number
  preview?: PreviewQuestion[]
  error?: string
  rawTextPreview?: string
}

export default function UploadWordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bankId = searchParams.get('bankId')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (ext !== 'docx' && ext !== 'doc') {
      toast.error('Faqat .docx yoki .doc fayl qabul qilinadi')
      return
    }
    setFile(f)
    setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleUpload = async () => {
    if (!file) { toast.error('Fayl tanlanmagan'); return }
    if (!subjectName.trim()) { toast.error('Fan nomi kiritilmagan'); return }

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subjectName', subjectName.trim())
    formData.append('description', description)
    if (bankId) formData.append('bankId', bankId)

    try {
      const res = await fetch('/api/question-banks/parse-word', {
        method: 'POST',
        body: formData,
      })
      const data: ParseResult = await res.json()
      setResult(data)

      if (data.success) {
        toast.success(`${data.questionCount} ta savol muvaffaqiyatli yuklandi!`)
      } else {
        toast.error(data.error || 'Xatolik yuz berdi')
      }
    } catch (e) {
      toast.error('Tarmoq xatoligi')
    } finally {
      setLoading(false)
    }
  }

  const goToBank = () => {
    if (result?.bankId) router.push(`/admin/question-banks/${result.bankId}`)
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href="/admin/question-banks"><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Word Fayl Yuklash</h1>
              <p className="text-teal-100 mt-0.5">Savollar avtomatik aniqlanadi va baza yaratiladi</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Format instructions */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4" /> Word fayl formati
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
          <p>O'qituvchi Word faylida savollarni quyidagi formatda yozsin:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-blue-950/40 rounded-lg p-3 font-mono text-xs space-y-1">
              <p className="font-bold text-blue-600 dark:text-blue-400 font-sans text-sm mb-2">✅ Format 1 — * belgisi bilan (tavsiya etiladi)</p>
              <p>1. Savol matni?</p>
              <p>A) Variant bir</p>
              <p>B) Variant ikki</p>
              <p className="text-green-600 dark:text-green-400 font-bold">*C) To'g'ri javob ← * belgisi</p>
              <p>D) Variant to'rt</p>
              <p className="mt-2">2. Keyingi savol...</p>
              <p>*A) To'g'ri javob</p>
              <p>B) Noto'g'ri</p>
            </div>
            <div className="bg-white dark:bg-blue-950/40 rounded-lg p-3 font-mono text-xs space-y-1">
              <p className="font-bold text-blue-600 dark:text-blue-400 font-sans text-sm mb-2">✅ Format 2 — bir qatorda</p>
              <p>1. Savol matni?</p>
              <p>A) V1   <span className="text-green-600 dark:text-green-400 font-bold">*B) To'g'ri</span>   C) V3   D) V4</p>
              <p className="mt-2 text-blue-500 dark:text-blue-400 font-sans font-normal text-xs">Agar * bo'lmasa, javobni keyinchalik qo'lda belgilash mumkin</p>
            </div>
          </div>
          <p className="text-xs opacity-80">
            ⭐ <strong>To'g'ri javob belgisi:</strong> Variant oldiga <code className="bg-black/10 dark:bg-white/10 px-1 rounded">*</code> qo'ying → avtomatik aniqlanadi
            <br/>⚠️ Har bir savol raqam bilan boshlanishi shart: <code>1.</code> yoki <code>1)</code>
          </p>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-2">
        <CardContent className="pt-6 space-y-5">
          {/* Subject name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Fan nomi <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Masalan: Matematika, Fizika, Biologiya..."
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Bu baza haqida qo'shimcha ma'lumot..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* File drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                : file
                  ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/10'
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
                  <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-semibold text-green-700 dark:text-green-300">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB • Fayl tanlandi
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400">Boshqa fayl tanlash uchun bosing</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-teal-100 dark:bg-teal-900/40 rounded-full">
                  <Upload className="h-10 w-10 text-teal-500" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Word faylni bu yerga tashlang</p>
                  <p className="text-muted-foreground text-sm mt-1">yoki bosib tanlang</p>
                </div>
                <Badge variant="outline" className="text-xs">.docx · .doc</Badge>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={loading || !file || !subjectName.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-base"
            size="lg"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Tahlil qilinmoqda...</>
            ) : (
              <><Database className="h-5 w-5 mr-2" /> Faylni Tahlil Qilib Baza Yaratish</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={`border-2 ${result.success ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
          <CardContent className="pt-6 space-y-4">
            {result.success ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <p className="font-bold text-green-700 dark:text-green-300 text-lg">
                      Muvaffaqiyatli! {result.questionCount} ta savol yuklandi
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      "{result.subjectName}" fan bazasi yaratildi
                    </p>
                    {/* Auto-answer stats */}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        (result.autoAnswerCount ?? 0) === result.questionCount
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {result.autoAnswerCount ?? 0} ta to'g'ri javob avtomatik aniqlandi
                          {(result.autoAnswerCount ?? 0) === result.questionCount && ' ✓ Barchasi!'}
                        </span>
                      </div>
                      {(result.autoAnswerCount ?? 0) < (result.questionCount ?? 0) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                          <AlertCircle className="h-4 w-4" />
                          {(result.questionCount ?? 0) - (result.autoAnswerCount ?? 0)} ta savol uchun javobni qo'lda belgilash kerak
                        </div>
                      )}
                    </div>
                    {(result.autoAnswerCount ?? 0) < (result.questionCount ?? 0) && (
                      <p className="text-xs text-muted-foreground">
                        💡 To'g'ri javob oldiga <code className="bg-black/10 dark:bg-white/10 px-1 rounded">*</code> belgisi qo'ying.
                        Masalan: <code className="bg-black/10 dark:bg-white/10 px-1 rounded">*C) alfa = betta</code>
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {result.preview && result.preview.length > 0 && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="mb-2"
                    >
                      {showPreview ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                      {showPreview ? "Ko'rishni yopish" : "Dastlabki 3 ta savolni ko'rish"}
                    </Button>
                    {showPreview && (
                      <div className="space-y-3">
                        {result.preview.map((q, i) => (
                          <div key={i} className="p-4 rounded-xl border bg-card">
                            <p className="font-medium mb-2">{i + 1}. {q.text}</p>
                            <div className="grid grid-cols-2 gap-1 text-sm">
                              <span className="flex gap-1.5"><Badge variant="outline" className="text-xs">A</Badge>{q.optionA}</span>
                              <span className="flex gap-1.5"><Badge variant="outline" className="text-xs">B</Badge>{q.optionB}</span>
                              {q.optionC && <span className="flex gap-1.5"><Badge variant="outline" className="text-xs">C</Badge>{q.optionC}</span>}
                              {q.optionD && <span className="flex gap-1.5"><Badge variant="outline" className="text-xs">D</Badge>{q.optionD}</span>}
                            </div>
                          </div>
                        ))}
                        {result.questionCount && result.questionCount > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            ...va yana {result.questionCount - 3} ta savol
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={goToBank} className="flex-1 bg-teal-600 hover:bg-teal-700">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Bazani Ko'rish va Javoblarni Belgilash
                  </Button>
                  <Button variant="outline" onClick={() => { setFile(null); setResult(null) }}>
                    Boshqa fayl yuklash
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">Xatolik yuz berdi</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-line">{result.error}</p>
                  </div>
                </div>
                {result.rawTextPreview && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Fayldan o'qilgan matn (dastlabki 500 belgi):</p>
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-32">{result.rawTextPreview}</pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
