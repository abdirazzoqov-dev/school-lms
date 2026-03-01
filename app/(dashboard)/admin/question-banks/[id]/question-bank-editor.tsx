'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Circle, Search, Save, Loader2, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string | null
  optionD: string | null
  optionE: string | null
  correctAnswer: string | null
  order: number
}

type FilterMode = 'all' | 'answered' | 'unanswered'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

export function QuestionBankEditor({ bankId, questions: initialQuestions }: {
  bankId: string
  questions: Question[]
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())

  const setAnswer = useCallback((qId: string, letter: string) => {
    setQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, correctAnswer: q.correctAnswer === letter ? null : letter } : q
    ))
    setDirtyIds(prev => new Set(prev).add(qId))
  }, [])

  const saveAll = async () => {
    setSaving(true)
    try {
      const payload = questions
        .filter(q => dirtyIds.has(q.id))
        .map(q => ({ id: q.id, correctAnswer: q.correctAnswer }))

      if (payload.length === 0) { toast.info('Hech qanday o\'zgarish yo\'q'); setSaving(false); return }

      const res = await fetch(`/api/question-banks/${bankId}/answers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload })
      })

      if (res.ok) {
        toast.success('Javoblar saqlandi!')
        setDirtyIds(new Set())
        router.refresh()
      } else {
        toast.error("Saqlashda xatolik")
      }
    } catch {
      toast.error("Tarmoq xatoligi")
    } finally {
      setSaving(false)
    }
  }

  // Set all answers at once (bulk)
  const setBulkAnswers = async (letter: string) => {
    setQuestions(prev => prev.map(q => ({ ...q, correctAnswer: q.correctAnswer ?? letter })))
    setDirtyIds(prev => {
      const n = new Set(prev)
      questions.filter(q => !q.correctAnswer).forEach(q => n.add(q.id))
      return n
    })
    toast.info(`Belgilanmagan savollarga ${letter} belgilandi`)
  }

  const filtered = questions.filter(q => {
    if (filter === 'answered' && !q.correctAnswer) return false
    if (filter === 'unanswered' && q.correctAnswer) return false
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const answeredCount = questions.filter(q => q.correctAnswer).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Savollarni qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'answered', 'unanswered'] as FilterMode[]).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              {f === 'all' ? `Barchasi (${questions.length})` :
               f === 'answered' ? `✓ Belgilangan (${answeredCount})` :
               `○ Belgilanmagan (${questions.length - answeredCount})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk action + save */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Belgilanmaganlarni:</span>
          {OPTION_LETTERS.map(l => (
            <Button key={l} size="sm" variant="outline"
              className="w-10 h-8 font-bold border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950"
              onClick={() => setBulkAnswers(l)}
            >{l}</Button>
          ))}
          <span className="text-xs text-muted-foreground">(faqat belgilanmaganlar uchun)</span>
        </div>
        <Button
          onClick={saveAll}
          disabled={saving || dirtyIds.size === 0}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saqlanmoqda...</> :
                    <><Save className="h-4 w-4 mr-2" />Saqlash {dirtyIds.size > 0 && `(${dirtyIds.size})`}</>}
        </Button>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Hech nima topilmadi</p>
          </div>
        )}
        {filtered.map((q) => {
          const isDirty = dirtyIds.has(q.id)
          const isExpanded = expandedId === q.id
          const options: { letter: string; text: string }[] = [
            { letter: 'A', text: q.optionA },
            { letter: 'B', text: q.optionB },
            ...(q.optionC ? [{ letter: 'C', text: q.optionC }] : []),
            ...(q.optionD ? [{ letter: 'D', text: q.optionD }] : []),
            ...(q.optionE ? [{ letter: 'E', text: q.optionE }] : []),
          ]

          return (
            <div
              key={q.id}
              className={`rounded-xl border-2 transition-all ${
                isDirty ? 'border-yellow-300 dark:border-yellow-700' :
                q.correctAnswer ? 'border-green-200 dark:border-green-800' :
                'border-slate-200 dark:border-slate-700'
              } bg-card hover:shadow-md`}
            >
              {/* Question row */}
              <div className="flex items-start gap-3 p-4">
                {/* Number */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  q.correctAnswer
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                }`}>
                  {q.order + 1}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug">{q.text}</p>
                </div>

                {/* Answer buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {options.map(opt => (
                    <button
                      key={opt.letter}
                      onClick={() => setAnswer(q.id, opt.letter)}
                      className={`w-9 h-9 rounded-full border-2 font-bold text-sm transition-all ${
                        q.correctAnswer === opt.letter
                          ? 'bg-teal-500 border-teal-500 text-white scale-110 shadow-md'
                          : 'border-slate-300 dark:border-slate-600 text-muted-foreground hover:border-teal-400 hover:text-teal-600 dark:hover:border-teal-500 dark:hover:text-teal-400'
                      }`}
                    >
                      {opt.letter}
                    </button>
                  ))}
                  {isDirty && (
                    <Badge className="ml-1 text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300">
                      •
                    </Badge>
                  )}
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="shrink-0 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>

              {/* Expanded options */}
              {isExpanded && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {options.map(opt => (
                    <button
                      key={opt.letter}
                      onClick={() => setAnswer(q.id, opt.letter)}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                        q.correctAnswer === opt.letter
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${
                        q.correctAnswer === opt.letter
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'border-current'
                      }`}>{opt.letter}</span>
                      <span className="text-sm">{opt.text}</span>
                      {q.correctAnswer === opt.letter && <CheckCircle2 className="h-4 w-4 ml-auto text-teal-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating save */}
      {dirtyIds.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={saveAll}
            disabled={saving}
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 shadow-2xl"
          >
            {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            Saqlash ({dirtyIds.size} ta o'zgarish)
          </Button>
        </div>
      )}
    </div>
  )
}
