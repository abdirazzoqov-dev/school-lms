import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Plus, FileText, BookOpen, Upload, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { QuestionBanksClient } from './question-banks-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function QuestionBanksPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const banks = await db.questionBank.findMany({
    where: { tenantId },
    include: {
      _count: { select: { questions: true } },
      createdBy: { select: { fullName: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalBanks = banks.length
  const totalQuestions = banks.reduce((s, b) => s + b._count.questions, 0)
  const withAnswers = await db.question.count({
    where: { tenantId, correctAnswer: { not: null } }
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Database className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold">Savollar Bazasi</h1>
            </div>
            <p className="text-teal-100 text-lg">
              Word fayldan savollarni avtomatik import qilish va boshqarish
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-teal-50 shadow-lg">
            <Link href="/admin/question-banks/upload">
              <Upload className="mr-2 h-5 w-5" />
              Word Fayl Yuklash
            </Link>
          </Button>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900/80">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-teal-500" />
              <span className="text-sm text-teal-600 dark:text-teal-400">Fanlar bazasi</span>
            </div>
            <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{totalBanks}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/80">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-blue-600 dark:text-blue-400">Jami savollar</span>
            </div>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalQuestions}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900/80">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">Javob belgilangan</span>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{withAnswers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Banks list */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-teal-600 to-emerald-600 rounded-full" />
                Fanlar Ro'yxati
              </CardTitle>
              <CardDescription className="mt-1">{totalBanks} ta fan bazasi</CardDescription>
            </div>
            <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
              <Link href="/admin/question-banks/upload">
                <Plus className="mr-1.5 h-4 w-4" /> Yangi fan
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <QuestionBanksClient banks={banks as any} />
        </CardContent>
      </Card>
    </div>
  )
}
