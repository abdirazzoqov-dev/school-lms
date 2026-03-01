import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Database, FileText, CheckCircle2, BookOpen, Upload } from 'lucide-react'
import Link from 'next/link'
import { QuestionBankEditor } from './question-bank-editor'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function QuestionBankDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const bank = await db.questionBank.findUnique({
    where: { id: params.id, tenantId },
    include: {
      questions: { orderBy: { order: 'asc' } },
      createdBy: { select: { fullName: true } }
    }
  })

  if (!bank) redirect('/admin/question-banks')

  const answeredCount = bank.questions.filter(q => q.correctAnswer).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href="/admin/question-banks"><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Database className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{bank.subjectName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {bank.fileName && (
                    <Badge className="bg-white/20 text-white text-xs">
                      <FileText className="h-3 w-3 mr-1" /> {bank.fileName}
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-white text-xs">
                    {bank.questions.length} ta savol
                  </Badge>
                  <Badge className={`text-xs ${answeredCount === bank.questions.length && bank.questions.length > 0 ? 'bg-green-400/30' : 'bg-yellow-400/20'} text-white`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {answeredCount}/{bank.questions.length} javob belgilangan
                  </Badge>
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Link href={`/admin/question-banks/upload?bankId=${bank.id}`}>
                <Upload className="h-4 w-4 mr-2" /> Savollarni yangilash
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Progress bar */}
      {bank.questions.length > 0 && (
        <Card className="border-2 border-teal-200 dark:border-teal-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Javoblar belgilash holati</span>
              <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                {answeredCount}/{bank.questions.length} ({Math.round((answeredCount / bank.questions.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-teal-100 dark:bg-teal-900/40 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(answeredCount / bank.questions.length) * 100}%` }}
              />
            </div>
            {answeredCount === bank.questions.length && bank.questions.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Barcha javoblar belgilangan! Baza imtihonda ishlatishga tayyor.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <QuestionBankEditor bankId={bank.id} questions={bank.questions as any} />
    </div>
  )
}
