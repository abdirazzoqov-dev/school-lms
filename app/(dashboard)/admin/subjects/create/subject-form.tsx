'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createSubject } from '@/app/actions/subject'
import { Loader2 } from 'lucide-react'

const PREDEFINED_COLORS = [
  { name: 'Ko\'k', value: '#3b82f6' },
  { name: 'Yashil', value: '#10b981' },
  { name: 'Qizil', value: '#ef4444' },
  { name: 'Sariq', value: '#f59e0b' },
  { name: 'Binafsha', value: '#8b5cf6' },
  { name: 'Pushti', value: '#ec4899' },
  { name: 'To\'q ko\'k', value: '#06b6d4' },
  { name: 'Och yashil', value: '#84cc16' },
]

interface SubjectFormProps {
  initialData?: {
    name: string
    code: string
    description?: string
    color?: string
  }
  isEdit?: boolean
  subjectId?: string
}

export function SubjectForm({ initialData, isEdit = false, subjectId }: SubjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    color: initialData?.color || PREDEFINED_COLORS[0].value,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createSubject(formData)

      if (result.success) {
        toast.success('Fan qo\'shildi')
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
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Fan nomi *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Masalan: Matematika"
            required
          />
        </div>

        <div>
          <Label htmlFor="code">Kod *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Masalan: MATH"
            required
            pattern="[A-Z_]+"
            title="Faqat katta harflar va _ belgisi"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Faqat katta harflar va _ belgisi (Masalan: MATH, ENG_LIT)
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Fan haqida qisqacha ma'lumot"
          rows={3}
        />
      </div>

      <div>
        <Label>Rang</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {PREDEFINED_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={`flex items-center gap-2 p-2 rounded-md border-2 transition-all ${
                formData.color === color.value
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/admin/subjects">
          <Button type="button" variant="outline">
            Bekor qilish
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            isEdit ? 'Yangilash' : 'Qo\'shish'
          )}
        </Button>
      </div>
    </form>
  )
}

