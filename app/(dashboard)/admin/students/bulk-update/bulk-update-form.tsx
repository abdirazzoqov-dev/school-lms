'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Users, DollarSign, Calendar, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  studentCode: string
  monthlyTuitionFee: any
  user: {
    fullName: string
  } | null
  class: {
    name: string
  } | null
}

interface BulkUpdateFormProps {
  students: Student[]
}

export function BulkUpdateForm({ students }: BulkUpdateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [newTuitionFee, setNewTuitionFee] = useState('')
  const [displayAmount, setDisplayAmount] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      .toISOString()
      .split('T')[0]
  )

  // Format number with spaces
  const formatNumberWithSpaces = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const digitsOnly = inputValue.replace(/\D/g, '')
    
    setNewTuitionFee(digitsOnly)
    setDisplayAmount(formatNumberWithSpaces(digitsOnly))
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const selectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (selectedStudents.length === 0) {
        toast.error('Kamida bitta o\'quvchi tanlang')
        return
      }

      if (!newTuitionFee || parseFloat(newTuitionFee) <= 0) {
        toast.error('Yangi to\'lov miqdorini kiriting')
        return
      }

      const response = await fetch('/api/admin/students/bulk-update-tuition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudents,
          newTuitionFee: parseFloat(newTuitionFee),
          effectiveDate
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message || 'Muvaffaqiyatli yangilandi!')
        router.push('/admin/students')
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
      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami O'quvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tanlangan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {selectedStudents.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yangi To'lov
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {displayAmount ? `${displayAmount} so'm` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>To'lov Sozlamalari</CardTitle>
          <CardDescription>
            Yangi to'lov miqdorini kiriting va qaysi oydan boshlab qo'llanishini belgilang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newTuitionFee">
                Yangi Oylik To'lov (so'm) *
              </Label>
              <Input
                id="newTuitionFee"
                type="text"
                inputMode="numeric"
                placeholder="1 000 000"
                value={displayAmount}
                onChange={handleAmountChange}
                className="text-lg font-mono"
                required
              />
              {newTuitionFee && (
                <p className="text-xs text-muted-foreground">
                  {parseInt(newTuitionFee).toLocaleString('uz-UZ')} so'm
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">
                Qo'llanish Sanasi *
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (Qaysi oydan boshlab)
                </span>
              </Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Faqat shu oydan keyingi to'lovlarga ta'sir qiladi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>O'quvchilarni Tanlang</CardTitle>
              <CardDescription>
                {selectedStudents.length > 0
                  ? `${selectedStudents.length} ta o'quvchi tanlandi`
                  : 'O\'quvchilarni tanlang'}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={selectAll}>
              {selectedStudents.length === students.length ? 'Bekor qilish' : 'Hammasini tanlash'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedStudents.includes(student.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <div>
                    <p className="font-medium">{student.user?.fullName || 'Noma\'lum'}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.studentCode} • {student.class?.name || 'Sinfsiz'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {Number(student.monthlyTuitionFee || 0).toLocaleString('uz-UZ')} so'm
                  </p>
                  <p className="text-xs text-muted-foreground">Hozirgi to'lov</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading || selectedStudents.length === 0}
          className="flex-1"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Yangilash ({selectedStudents.length} ta)
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Bekor qilish
        </Button>
      </div>
    </form>
  )
}

