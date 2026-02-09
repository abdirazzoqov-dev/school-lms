'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Calendar, DollarSign, CheckCircle2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

interface MultiMonthPaymentFormProps {
  students: Student[]
}

const MONTHS = [
  { value: 1, label: 'Yanvar' },
  { value: 2, label: 'Fevral' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Aprel' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Iyun' },
  { value: 7, label: 'Iyul' },
  { value: 8, label: 'Avgust' },
  { value: 9, label: 'Sentabr' },
  { value: 10, label: 'Oktabr' },
  { value: 11, label: 'Noyabr' },
  { value: 12, label: 'Dekabr' },
]

export function MultiMonthPaymentForm({ students }: MultiMonthPaymentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentId: '',
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    monthsCount: 1,
    paymentAmount: '',
    displayAmount: '',
    paymentMethod: 'CASH' as 'CASH' | 'CLICK'
  })

  const selectedStudent = students.find(s => s.id === formData.studentId)
  const monthlyFee = Number(selectedStudent?.monthlyTuitionFee || 0)
  const totalAmount = monthlyFee * formData.monthsCount
  const paidAmount = parseFloat(formData.paymentAmount) || 0
  const remainingAmount = totalAmount - paidAmount

  // Format number with spaces
  const formatNumberWithSpaces = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const digitsOnly = inputValue.replace(/\D/g, '')
    
    setFormData(prev => ({
      ...prev,
      paymentAmount: digitsOnly,
      displayAmount: formatNumberWithSpaces(digitsOnly)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.studentId) {
        toast.error('O\'quvchini tanlang')
        return
      }

      if (formData.monthsCount < 1) {
        toast.error('Kamida 1 oy tanlang')
        return
      }

      const response = await fetch('/api/admin/payments/multi-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formData.studentId,
          startMonth: formData.startMonth,
          startYear: formData.startYear,
          monthsCount: formData.monthsCount,
          paymentAmount: parseFloat(formData.paymentAmount) || 0,
          paymentMethod: formData.paymentMethod
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message || 'To\'lovlar yaratildi!')
        router.push('/admin/payments')
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
      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle>O'quvchini Tanlang</CardTitle>
          <CardDescription>
            To'lov qabul qilinadigan o'quvchini tanlang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">O'quvchi *</Label>
            <Select
              value={formData.studentId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="O'quvchini tanlang" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{student.user?.fullName || 'Noma\'lum'}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.studentCode} • {student.class?.name || 'Sinfsiz'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Oylik to'lov: <strong>{monthlyFee.toLocaleString('uz-UZ')} so'm</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>To'lov Davri</CardTitle>
          <CardDescription>
            Qaysi oydan boshlab va necha oy uchun to'lov qilinadi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startMonth">Boshlang'ich Oy *</Label>
              <Select
                value={formData.startMonth.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, startMonth: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startYear">Yil *</Label>
              <Select
                value={formData.startYear.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, startYear: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthsCount">Necha Oy *</Label>
              <Input
                id="monthsCount"
                type="number"
                min="1"
                max="12"
                value={formData.monthsCount}
                onChange={(e) => setFormData(prev => ({ ...prev, monthsCount: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
          </div>

          {selectedStudent && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>{formData.monthsCount} oy</strong> uchun jami: <strong className="text-green-600">{totalAmount.toLocaleString('uz-UZ')} so'm</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Amount */}
      <Card>
        <CardHeader>
          <CardTitle>To'lov Summasi</CardTitle>
          <CardDescription>
            Qancha summa to'lanayotganini kiriting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">To'lov Summasi (so'm)</Label>
              <Input
                id="paymentAmount"
                type="text"
                inputMode="numeric"
                placeholder="1 000 000"
                value={formData.displayAmount}
                onChange={handleAmountChange}
                className="text-lg font-mono"
              />
              {formData.paymentAmount && (
                <p className="text-xs text-muted-foreground">
                  {parseInt(formData.paymentAmount).toLocaleString('uz-UZ')} so'm
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">To'lov Usuli *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Naqd</SelectItem>
                  <SelectItem value="CLICK">Plastik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {paidAmount > 0 && (
            <div className="grid gap-2 grid-cols-3 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Jami:</p>
                <p className="font-bold">{totalAmount.toLocaleString('uz-UZ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To'lanyapti:</p>
                <p className="font-bold text-green-600">{paidAmount.toLocaleString('uz-UZ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qoldi:</p>
                <p className="font-bold text-orange-600">{remainingAmount.toLocaleString('uz-UZ')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading || !selectedStudent}
          className="flex-1"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle2 className="mr-2 h-4 w-4" />
          To'lovlarni Yaratish
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

