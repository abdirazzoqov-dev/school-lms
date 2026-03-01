'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Database, FileText, BookOpen, Upload, Eye, Trash2,
  CheckCircle2, AlertCircle, Calendar, User
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Bank {
  id: string
  subjectName: string
  description: string | null
  fileName: string | null
  totalCount: number
  createdAt: string
  createdBy: { fullName: string } | null
  _count: { questions: number }
}

export function QuestionBanksClient({ banks }: { banks: Bank[] }) {
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    const res = await fetch(`/api/question-banks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(`"${name}" bazasi o'chirildi`)
      router.refresh()
    } else {
      toast.error("O'chirishda xatolik")
    }
  }

  if (banks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Database className="h-16 w-16 mb-3 opacity-30" />
        <p className="text-lg font-medium">Savollar bazasi mavjud emas</p>
        <p className="text-sm mt-1 mb-4">Word fayl yuklash orqali savollar bazasini yarating</p>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/admin/question-banks/upload">
            <Upload className="h-4 w-4 mr-2" /> Word Fayl Yuklash
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {banks.map(bank => {
        const hasAnswers = bank._count.questions > 0
        const readyPct = bank.totalCount > 0 ? Math.round((bank._count.questions / bank.totalCount) * 100) : 0

        return (
          <div
            key={bank.id}
            className="flex flex-col md:flex-row gap-4 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-card hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all"
          >
            {/* Icon + info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/40 rounded-xl shrink-0">
                <Database className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg">{bank.subjectName}</h3>
                  <Badge variant="outline" className="text-xs border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400">
                    {bank._count.questions} ta savol
                  </Badge>
                  {bank.fileName && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {bank.fileName}
                    </Badge>
                  )}
                </div>
                {bank.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{bank.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {bank.createdBy && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {bank.createdBy.fullName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(bank.createdAt).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:items-end">
              <Button asChild variant="outline" size="sm" className="hover:border-teal-400">
                <Link href={`/admin/question-banks/${bank.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Ko'rish / Javob belgilash
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hover:border-blue-400">
                <Link href={`/admin/question-banks/upload?bankId=${bank.id}`}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Yangilash
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bazani o'chirish</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{bank.subjectName}" bazasi va {bank._count.questions} ta savol o'chiriladi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(bank.id, bank.subjectName)}
                      className="bg-red-600 hover:bg-red-700"
                    >O'chirish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )
      })}
    </div>
  )
}
