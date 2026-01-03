'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { bulkCreateSubjects } from '@/app/actions/subject'
import { Loader2, Check } from 'lucide-react'

const STANDARD_SUBJECTS = [
  { name: 'Matematika', code: 'MATH', description: 'Matematika fani', color: '#3b82f6' },
  { name: 'Fizika', code: 'PHYS', description: 'Fizika fani', color: '#8b5cf6' },
  { name: 'Kimyo', code: 'CHEM', description: 'Kimyo fani', color: '#10b981' },
  { name: 'Biologiya', code: 'BIO', description: 'Biologiya fani', color: '#84cc16' },
  { name: 'Ona tili', code: 'UZ_LANG', description: 'O\'zbek tili va adabiyoti', color: '#ef4444' },
  { name: 'Ingliz tili', code: 'ENG', description: 'Ingliz tili', color: '#f59e0b' },
  { name: 'Rus tili', code: 'RUS', description: 'Rus tili', color: '#ec4899' },
  { name: 'Tarix', code: 'HIST', description: 'O\'zbekiston tarixi va Jahon tarixi', color: '#06b6d4' },
  { name: 'Geografiya', code: 'GEO', description: 'Geografiya fani', color: '#14b8a6' },
  { name: 'Informatika', code: 'IT', description: 'Informatika va AT', color: '#6366f1' },
  { name: 'Jismoniy tarbiya', code: 'PE', description: 'Jismoniy tarbiya', color: '#f97316' },
  { name: 'Texnologiya', code: 'TECH', description: 'Texnologiya (mehnat ta\'limi)', color: '#78716c' },
  { name: 'Chizmachilik', code: 'DRAW', description: 'Chizmachilik', color: '#a855f7' },
  { name: 'Musiqa', code: 'MUS', description: 'Musiqa madaniyati', color: '#ec4899' },
  { name: 'Tasviriy san\'at', code: 'ART', description: 'Tasviriy san\'at', color: '#f43f5e' },
  { name: 'Huquq', code: 'LAW', description: 'Huquq asoslari', color: '#0891b2' },
  { name: 'Iqtisod', code: 'ECON', description: 'Iqtisod asoslari', color: '#059669' },
]

export function QuickSetupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    STANDARD_SUBJECTS.map((_, index) => index.toString())
  )

  const handleToggle = (index: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const handleSelectAll = () => {
    setSelectedSubjects(STANDARD_SUBJECTS.map((_, index) => index.toString()))
  }

  const handleDeselectAll = () => {
    setSelectedSubjects([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedSubjects.length === 0) {
      toast.error('Kamida bitta fan tanlang')
      return
    }

    setIsLoading(true)

    try {
      const subjectsToCreate = selectedSubjects.map((index) =>
        STANDARD_SUBJECTS[parseInt(index)]
      )

      const result = await bulkCreateSubjects(subjectsToCreate)

      if (result.success && result.data) {
        const { created, errors } = result.data

        if (created > 0) {
          toast.success(`${created} ta fan qo'shildi`)
        }

        if (errors > 0) {
          toast.warning(`${errors} ta fan qo'shilmadi (allaqachon mavjud)`)
        }

        router.push('/admin/subjects')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Select/Deselect All */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          Barchasini tanlash
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
        >
          Tanlovni bekor qilish
        </Button>
      </div>

      {/* Subjects List */}
      <div className="grid gap-3 md:grid-cols-2">
        {STANDARD_SUBJECTS.map((subject, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
              selectedSubjects.includes(index.toString())
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Checkbox
              id={`subject-${index}`}
              checked={selectedSubjects.includes(index.toString())}
              onCheckedChange={() => handleToggle(index.toString())}
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={`subject-${index}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {subject.code} - {subject.description}
                  </div>
                </div>
                {selectedSubjects.includes(index.toString()) && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-center">
          <span className="font-semibold">{selectedSubjects.length}</span> ta fan tanlandi
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Link href="/admin/subjects">
          <Button type="button" variant="outline">
            Bekor qilish
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading || selectedSubjects.length === 0}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Qo'shilmoqda...
            </>
          ) : (
            `${selectedSubjects.length} ta fanni qo'shish`
          )}
        </Button>
      </div>
    </form>
  )
}

