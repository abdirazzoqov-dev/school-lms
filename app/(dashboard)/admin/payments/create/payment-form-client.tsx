'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createPayment } from '@/app/actions/payment'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, DollarSign, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { formatNumber } from '@/lib/utils'

interface Student {
  id: string
  studentCode: string
  monthlyTuitionFee: any
  user: {
    fullName: string
  } | null
  class: {
    id: string
    name: string
  } | null
}

interface Class {
  id: string
  name: string
  _count?: {
    students: number
  }
}

interface PaymentFormClientProps {
  initialStudents: Student[]
  initialClasses: Class[]
  preSelectedStudentId?: string // ✅ URL'dan kelgan studentId
  preSelectedMonth?: number // ✅ URL'dan kelgan month
  preSelectedYear?: number // ✅ URL'dan kelgan year
}

export function PaymentFormClient({ 
  initialStudents, 
  initialClasses,
  preSelectedStudentId,
  preSelectedMonth,
  preSelectedYear
}: PaymentFormClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [allStudents] = useState<Student[]>(initialStudents)
  const [classes] = useState<Class[]>(initialClasses)
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [acceptPayment, setAcceptPayment] = useState(true)
  const [hasDiscount, setHasDiscount] = useState(false) // ✅ Chegirma flag
  
  const [formData, setFormData] = useState({
    studentId: preSelectedStudentId || '', // ✅ Pre-fill
    amount: 0,
    paymentType: 'TUITION' as 'TUITION' | 'BOOKS' | 'UNIFORM' | 'OTHER',
    paymentMethod: 'CASH' as 'CASH' | 'CLICK' | 'PAYME' | 'UZUM',
    dueDate: preSelectedMonth && preSelectedYear 
      ? new Date(preSelectedYear, preSelectedMonth - 1, 5).toISOString().split('T')[0] // ✅ Pre-fill due date
      : new Date().toISOString().split('T')[0],
    paidDate: '',
    receiptNumber: '',
    notes: preSelectedMonth && preSelectedYear
      ? `${preSelectedYear}-${String(preSelectedMonth).padStart(2, '0')} oyi uchun to'lov` // ✅ Pre-fill notes
      : '',
    discountAmount: 0,        // ✅ Chegirma summasi
    discountPercentage: 0,    // ✅ Chegirma foizi
    discountReason: '',       // ✅ Chegirma sababi
    originalAmount: 0         // ✅ Chegirmadan oldingi asl summa
  })

  // Filter students by class and search
  useEffect(() => {
    let filtered = allStudents

    // Filter by class
    if (selectedClass) {
      filtered = filtered.filter((s) => s.class?.id === selectedClass)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((s) => 
        s.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setStudents(filtered)
  }, [selectedClass, searchQuery, allStudents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.studentId) {
      toast({
        title: 'Xato!',
        description: 'O\'quvchini tanlang',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const submitData = {
        ...formData,
        paidDate: acceptPayment ? new Date().toISOString().split('T')[0] : formData.paidDate
      }
      
      const result = await createPayment(submitData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'To\'lov muvaffaqiyatli yaratildi',
        })
        router.push('/admin/payments')
      } else {
        toast({
          title: 'Xato!',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  const generateReceiptNumber = () => {
    const date = new Date()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const receipt = `RCP${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${random}`
    setFormData(prev => ({ ...prev, receiptNumber: receipt }))
  }

  const selectedStudent = allStudents.find(s => s.id === formData.studentId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            To'lov Ma'lumotlari
          </CardTitle>
          <CardDescription>
            To'lov haqida asosiy ma'lumotlar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Filter */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">1️⃣ Sinfni tanlang *</Label>
                <Select
                  value={selectedClass}
                  onValueChange={(value) => {
                    setSelectedClass(value)
                    setFormData(prev => ({ ...prev, studentId: '' }))
                  }}
                >
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder="Sinf tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="empty" disabled>Sinflar yo'q</SelectItem>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{cls.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({cls._count?.students || 0} o'quvchi)
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ℹ️ Avval sinfni tanlang, o'quvchilar avtomatik chiqadi
                </p>
              </div>

              {/* Search */}
              {selectedClass && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">🔍 Qidirish (ixtiyoriy)</Label>
                  <Input
                    placeholder="Ism yoki kod bo'yicha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 border-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    📊 {students.length} ta o'quvchi topildi
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Students List */}
          {selectedClass && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                2️⃣ O'quvchini tanlang * 
                {formData.studentId && <span className="text-green-600 ml-2">✓ Tanlandi</span>}
              </Label>
              
              {students.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto border-2 rounded-xl border-blue-200 bg-blue-50/30">
                  <div className="grid gap-2 p-3">
                    {students.map((student) => {
                      const isSelected = formData.studentId === student.id
                      const monthlyFee = student.monthlyTuitionFee ? Number(student.monthlyTuitionFee) : 0
                      
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              studentId: student.id,
                              amount: monthlyFee > 0 ? monthlyFee : prev.amount
                            }))
                          }}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'bg-blue-500 border-blue-600 shadow-lg scale-[1.02]' 
                              : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              isSelected ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {(student.user?.fullName || student.studentCode).charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="text-left">
                              <p className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {student.user?.fullName || `O'quvchi ${student.studentCode}`}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                  📝 {student.studentCode}
                                </span>
                                {monthlyFee > 0 && (
                                  <span className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-green-600'}`}>
                                    💰 {formatNumber(monthlyFee)} so'm/oy
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="bg-white text-blue-600 rounded-full p-2 shadow-md">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-sm font-medium text-yellow-800">
                    {searchQuery ? 'Qidiruv natijalari topilmadi' : 'Ushbu sinfda o\'quvchilar yo\'q'}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {searchQuery ? 'Boshqa nom yoki kod bilan qidiring' : 'Avval sinfga o\'quvchi qo\'shing'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Class not selected */}
          {!selectedClass && (
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl text-center">
              <div className="text-5xl mb-3">🎓</div>
              <p className="text-lg font-semibold text-blue-900 mb-1">
                Sinf tanlang
              </p>
              <p className="text-sm text-blue-600">
                Yuqoridagi dropdown'dan sinfni tanlang, o'quvchilar avtomatik chiqadi
              </p>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
            <div className="space-y-2">
              <Label htmlFor="paymentType">To'lov Turi *</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentType: value }))}
              >
                <SelectTrigger id="paymentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUITION">O'qish haqi</SelectItem>
                  <SelectItem value="BOOKS">Kitoblar</SelectItem>
                  <SelectItem value="UNIFORM">Forma</SelectItem>
                  <SelectItem value="OTHER">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Summa (so'm) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">To'lov Usuli *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Naqd pul</SelectItem>
                  <SelectItem value="CLICK">Click</SelectItem>
                  <SelectItem value="PAYME">Payme</SelectItem>
                  <SelectItem value="UZUM">Uzum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Muddat *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                📅 Avtomatik: Bugungi sana
              </p>
            </div>
          </div>

          {/* Accept Payment Checkbox */}
          <div className="flex items-center space-x-2 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <Checkbox
              id="acceptPayment"
              checked={acceptPayment}
              onCheckedChange={(checked) => setAcceptPayment(checked as boolean)}
            />
            <div className="flex-1">
              <label
                htmlFor="acceptPayment"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                ✅ To'lovni darhol qabul qilish
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                To'lov bugun qabul qilingan hisoblanadi va Dashboard'da ko'rinadi
              </p>
            </div>
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Kvitansiya Raqami</Label>
            <div className="flex gap-2">
              <Input
                id="receiptNumber"
                placeholder="RCP20251213001"
                value={formData.receiptNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
              />
              <Button type="button" variant="outline" onClick={generateReceiptNumber}>
                Generatsiya
              </Button>
            </div>
          </div>

          {/* ✅ DISCOUNT SECTION */}
          <div className="space-y-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasDiscount"
                checked={hasDiscount}
                onCheckedChange={(checked) => {
                  setHasDiscount(checked as boolean)
                  if (!checked) {
                    // Reset discount fields
                    setFormData(prev => ({
                      ...prev,
                      discountAmount: 0,
                      discountPercentage: 0,
                      discountReason: '',
                      originalAmount: 0
                    }))
                  } else {
                    // Set original amount when enabling discount
                    setFormData(prev => ({
                      ...prev,
                      originalAmount: prev.amount
                    }))
                  }
                }}
              />
              <div className="flex-1">
                <label
                  htmlFor="hasDiscount"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  💰 Chegirma berish (erta to'lov uchun)
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  O'quvchi muddatidan erta to'lov qilgani uchun chegirma qo'llash
                </p>
              </div>
            </div>

            {hasDiscount && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-300">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">Asl summa (chegirmasiz) *</Label>
                  <Input
                    id="originalAmount"
                    type="number"
                    value={formData.originalAmount}
                    readOnly
                    disabled
                    className="bg-amber-100 cursor-not-allowed font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    📊 Chegirma berilmasdan oldingi summa
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Chegirma foizi (%) *</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => {
                      const percentage = Number(e.target.value)
                      const discountAmount = (formData.originalAmount * percentage) / 100
                      const finalAmount = formData.originalAmount - discountAmount
                      
                      setFormData(prev => ({
                        ...prev,
                        discountPercentage: percentage,
                        discountAmount: discountAmount,
                        amount: finalAmount
                      }))
                    }}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    📉 Foiz kiriting (masalan: 10 = 10%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Chegirma summasi *</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    value={formData.discountAmount}
                    readOnly
                    disabled
                    className="bg-amber-100 cursor-not-allowed font-semibold text-red-600"
                  />
                  <p className="text-xs text-muted-foreground">
                    💸 Avtomatik hisoblangan chegirma
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finalAmount">To'lash kerak bo'lgan summa *</Label>
                  <Input
                    id="finalAmount"
                    type="number"
                    value={formData.amount}
                    readOnly
                    disabled
                    className="bg-green-100 cursor-not-allowed font-bold text-green-700 text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    ✅ Chegirma qo'llanganidan keyingi summa
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="discountReason">Chegirma sababi *</Label>
                  <Textarea
                    id="discountReason"
                    placeholder="Masalan: 3 oy oldindan to'lov qilgani uchun 10% chegirma..."
                    value={formData.discountReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                    rows={2}
                    required={hasDiscount}
                  />
                  <p className="text-xs text-muted-foreground">
                    📝 Chegirma berilishiga sabab yozing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              placeholder="Qo'shimcha ma'lumotlar..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/payments')}
              disabled={isPending}
              className="flex-1"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.studentId}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                'To\'lov Yaratish'
              )}
            </Button>
          </div>

          {/* Selected Student Summary */}
          {selectedStudent && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-900 mb-2">📋 Tanlangan:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedStudent.user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStudent.studentCode} • {selectedStudent.class?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{formatNumber(formData.amount)} so'm</p>
                  <p className="text-xs text-muted-foreground">{formData.paymentType}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  )
}

