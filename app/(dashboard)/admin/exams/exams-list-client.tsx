'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck, BookOpen, Calendar, Users, FileText,
  Printer, BarChart3, Trash2, Eye, CheckCircle2, Clock,
  Archive, FlaskConical
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteExam, updateExamStatus } from '@/app/actions/exam'
import {
  AlertDialog as AlertDialogComp,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
  status: string
  subjects: ExamSubject[]
  _count: { results: number }
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT:     { label: 'Tayyorlanmoqda', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600', icon: Clock },
  PUBLISHED: { label: 'Nashr etilgan',  color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700', icon: CheckCircle2 },
  COMPLETED: { label: 'Yakunlangan',    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700', icon: Archive },
  ARCHIVED:  { label: 'Arxivlangan',   color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600', icon: Archive },
}

export function ExamsListClient({ exams }: { exams: Exam[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setLoadingId(id)
    const result = await deleteExam(id)
    setLoadingId(null)
    if (result.success) {
      toast.success("Imtihon o'chirildi")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handlePublish = async (id: string) => {
    const result = await updateExamStatus(id, 'PUBLISHED')
    if (result.success) {
      toast.success('Imtihon nashr etildi')
      router.refresh()
    }
  }

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ClipboardCheck className="h-16 w-16 mb-3 opacity-30" />
        <p className="text-lg font-medium">Imtihonlar mavjud emas</p>
        <p className="text-sm mt-1 mb-4">Yangi imtihon yarating</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/admin/exams/create">
            <FlaskConical className="h-4 w-4 mr-2" />
            Yangi Imtihon Yaratish
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {exams.map(exam => {
        const st = statusConfig[exam.status] || statusConfig.DRAFT
        const StatusIcon = st.icon
        const totalQuestions = exam.subjects.reduce((s, sub) => s + sub.questionCount, 0)
        const totalMax = exam.subjects.reduce((s, sub) => s + sub.questionCount * sub.pointsPerQ, 0)

        return (
          <div
            key={exam.id}
            className="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-card hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl shrink-0 mt-0.5">
                    <ClipboardCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{exam.title}</h3>
                    {exam.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{exam.description}</p>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 ml-11">
                  <Badge variant="outline" className={`${st.color} text-xs`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {st.label}
                  </Badge>
                  {exam.date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(exam.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  {exam.duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.duration} daqiqa
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {totalQuestions} ta savol
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {exam._count.results} ta natija
                  </div>
                </div>

                {/* Subject pills */}
                <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
                  {exam.subjects.map((sub, i) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                    >
                      <BookOpen className="h-3 w-3" />
                      {sub.subjectName}
                      <span className="text-indigo-500 dark:text-indigo-400">({sub.questionCount})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:items-end">
                <Button asChild variant="outline" size="sm" className="hover:border-indigo-400">
                  <Link href={`/admin/exams/${exam.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ko'rish
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="hover:border-green-400">
                  <Link href={`/admin/exams/${exam.id}/answer-sheet`}>
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Varaqalar
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="hover:border-blue-400">
                  <Link href={`/admin/exams/${exam.id}/results`}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Natijalar
                  </Link>
                </Button>
                {exam.status === 'DRAFT' && (
                  <Button
                    variant="outline" size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                    onClick={() => handlePublish(exam.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Nashr et
                  </Button>
                )}
                <AlertDialogComp>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Imtihonni o'chirish</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{exam.title}" imtihoni va barcha natijalari o'chiriladi. Bu amalni qaytarib bo'lmaydi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(exam.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        O'chirish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogComp>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
