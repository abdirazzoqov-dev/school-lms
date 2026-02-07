'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createSalaryPayment, getEmployeeMonthlyPayments } from '@/app/actions/salary'
import { Loader2, Calculator, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'

interface Teacher {
  id: string
  teacherCode: string
  salaryInfo: any
  user: {
    fullName: string
    email: string
    avatar: string | null
  }
}

interface Staff {
  id: string
  staffCode: string
  position: string
  monthlySalary: any
  salaryInfo: any
  user: {
    fullName: string
    email: string
    avatar: string | null
  }
}

interface SalaryPaymentFormProps {
  teachers: Teacher[]
  staff: Staff[]
}

export function SalaryPaymentForm({ teachers, staff }: SalaryPaymentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [employeeType, setEmployeeType] = useState<'teacher' | 'staff'>('teacher')
  
  // Already paid tracking
  const [alreadyPaid, setAlreadyPaid] = useState(0)
  const [previousPayments, setPreviousPayments] = useState<any[]>([])
  
  // Bugungi sana (YYYY-MM-DD format)
  const today = new Date().toISOString().split('T')[0]
  
  const [formData, setFormData] = useState({
    teacherId: '',
    staffId: '',
    type: 'FULL_SALARY',
    amount: 0,
    month: currentMonth,
    year: currentYear,
    baseSalary: 0,
    bonusAmount: 0,
    deductionAmount: 0,
    paymentDate: today, // Avtomatik bugungi kun
    paymentMethod: '',
    description: '',
    notes: ''
  })

  // Get selected employee salary info
  const getEmployeeSalary = () => {
    if (employeeType === 'teacher' && formData.teacherId) {
      const teacher = teachers.find(t => t.id === formData.teacherId)
      if (teacher && teacher.salaryInfo) {
        const salaryInfo = typeof teacher.salaryInfo === 'string'
          ? JSON.parse(teacher.salaryInfo)
          : teacher.salaryInfo
        return salaryInfo.monthlySalary || 0
      }
    } else if (employeeType === 'staff' && formData.staffId) {
      const staffMember = staff.find(s => s.id === formData.staffId)
      if (staffMember) {
        if (staffMember.monthlySalary) {
          return Number(staffMember.monthlySalary)
        }
        if (staffMember.salaryInfo) {
          const salaryInfo = typeof staffMember.salaryInfo === 'string'
            ? JSON.parse(staffMember.salaryInfo)
            : staffMember.salaryInfo
          return salaryInfo.monthlySalary || 0
        }
      }
    }
    return 0
  }

  // Fetch existing payments when employee/month/year changes
  useEffect(() => {
    const fetchExistingPayments = async () => {
      const employeeId = employeeType === 'teacher' ? formData.teacherId : formData.staffId
      
      if (!employeeId || !formData.month || !formData.year) {
        setAlreadyPaid(0)
        setPreviousPayments([])
        return
      }

      setLoadingPayments(true)
      try {
        const result = await getEmployeeMonthlyPayments(
          employeeId,
          employeeType,
          formData.month,
          formData.year
        )

        if (result.success) {
          setAlreadyPaid(result.totalPaid)
          setPreviousPayments(result.payments)
          
          // Auto-calculate remaining amount for FULL_SALARY
          if (formData.type === 'FULL_SALARY') {
            const monthlySalary = getEmployeeSalary()
            const remaining = Math.max(0, monthlySalary - result.totalPaid)
            setFormData(prev => ({
              ...prev,
              baseSalary: remaining
            }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error)
      } finally {
        setLoadingPayments(false)
      }
    }

    fetchExistingPayments()
  }, [formData.teacherId, formData.staffId, formData.month, formData.year, employeeType])

  // Calculate remaining amount
  const getMonthlySalary = () => getEmployeeSalary()
  const getRemainingAmount = () => {
    const total = getMonthlySalary()
    return Math.max(0, total - alreadyPaid)
  }
  
  // Check if payment would exceed remaining
  const wouldExceedLimit = () => {
    if (formData.type !== 'FULL_SALARY' && formData.type !== 'ADVANCE') return false
    
    const newPayment = calculateAmount()
    const remaining = getRemainingAmount()
    return newPayment > remaining
  }

  // Calculate total amount
  const calculateAmount = () => {
    if (formData.type === 'FULL_SALARY') {
      const base = Number(formData.baseSalary) || 0
      const bonus = Number(formData.bonusAmount) || 0
      const deduction = Number(formData.deductionAmount) || 0
      return base + bonus - deduction
    }
    return Number(formData.amount)
  }

  const handleEmployeeSelect = (id: string) => {
    if (employeeType === 'teacher') {
      setFormData({
        ...formData,
        teacherId: id,
        staffId: '',
        baseSalary: getEmployeeSalary()
      })
      
      // Auto-fill salary
      const teacher = teachers.find(t => t.id === id)
      if (teacher && teacher.salaryInfo) {
        const salaryInfo = typeof teacher.salaryInfo === 'string'
          ? JSON.parse(teacher.salaryInfo)
          : teacher.salaryInfo
        setFormData(prev => ({
          ...prev,
          baseSalary: salaryInfo.monthlySalary || 0
        }))
      }
    } else {
      setFormData({ ...formData, teacherId: '', staffId: id })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.teacherId && !formData.staffId) {
      toast.error('Xodim yoki o\'qituvchi tanlang')
      return
    }

    const finalAmount = calculateAmount()
    if (finalAmount <= 0) {
      toast.error('To\'lov summasi 0 dan katta bo\'lishi kerak')
      return
    }

    // Validate against remaining amount
    if (wouldExceedLimit()) {
      const remaining = getRemainingAmount()
      toast.error(
        `⚠️ Ortiqcha to'lov! Qolgan summa: ${(remaining / 1000000).toFixed(1)}M so'm`,
        { duration: 5000 }
      )
      return
    }

    setIsLoading(true)
    
    try {
      // BUGFIX: Only send teacherId OR staffId, not both
      const submitData = {
        ...formData,
        type: formData.type as "FULL_SALARY" | "ADVANCE" | "BONUS" | "DEDUCTION",
        paymentMethod: (formData.paymentMethod || undefined) as "CASH" | "CLICK" | "PAYME" | "UZUM" | "BANK" | "OTHER" | undefined,
        amount: finalAmount,
        // Clear the other ID to prevent foreign key constraint error
        teacherId: employeeType === 'teacher' ? formData.teacherId : undefined,
        staffId: employeeType === 'staff' ? formData.staffId : undefined,
      }
      
      const result = await createSalaryPayment(submitData)

      if (result.success) {
        toast.success('Maosh to\'lovi qo\'shildi! ✅')
        router.push('/admin/salaries')
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

  const selectedEmployee = employeeType === 'teacher'
    ? teachers.find(t => t.id === formData.teacherId)
    : staff.find(s => s.id === formData.staffId)

  const calculatedAmount = calculateAmount()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Type Selection */}
      <div className="space-y-2">
        <Label>Xodim Turi *</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={employeeType === 'teacher' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => {
              setEmployeeType('teacher')
              setFormData({ ...formData, staffId: '', teacherId: '' })
            }}
          >
            O'qituvchi
          </Button>
          <Button
            type="button"
            variant={employeeType === 'staff' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => {
              setEmployeeType('staff')
              setFormData({ ...formData, teacherId: '', staffId: '' })
            }}
          >
            Xodim
          </Button>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="space-y-2">
        <Label>{employeeType === 'teacher' ? 'O\'qituvchi' : 'Xodim'} *</Label>
        <Select
          value={employeeType === 'teacher' ? formData.teacherId : formData.staffId}
          onValueChange={handleEmployeeSelect}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Tanlang..." />
          </SelectTrigger>
          <SelectContent>
            {employeeType === 'teacher' ? (
              teachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{teacher.user.fullName}</span>
                    <span className="text-xs text-muted-foreground">({teacher.teacherCode})</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              staff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.user.fullName}</span>
                    <Badge variant="outline" className="text-xs">{s.position}</Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedEmployee && (
          <p className="text-sm text-muted-foreground">
            {selectedEmployee.user.email}
          </p>
        )}
      </div>

      {/* Payment Type */}
      <div className="space-y-2">
        <Label>To'lov Turi *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL_SALARY">
              <div>
                <div className="font-medium">To'liq Oylik Maosh</div>
                <div className="text-xs text-muted-foreground">Asosiy maosh + bonus - ushlab qolish</div>
              </div>
            </SelectItem>
            <SelectItem value="ADVANCE">
              <div>
                <div className="font-medium">Avans</div>
                <div className="text-xs text-muted-foreground">Oylik maoshdan oldindan to'lov</div>
              </div>
            </SelectItem>
            <SelectItem value="BONUS">
              <div>
                <div className="font-medium">Mukofot</div>
                <div className="text-xs text-muted-foreground">Qo'shimcha mukofot to'lovi</div>
              </div>
            </SelectItem>
            <SelectItem value="DEDUCTION">
              <div>
                <div className="font-medium">Ushlab Qolish</div>
                <div className="text-xs text-muted-foreground">Jarima yoki boshqa ushlab qolishlar</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Month & Year (for FULL_SALARY) */}
      {formData.type === 'FULL_SALARY' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Oy *</Label>
            <Select
              value={formData.month.toString()}
              onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((name, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Yil *</Label>
            <Select
              value={formData.year.toString()}
              onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Payment History & Remaining Amount - Show for FULL_SALARY and ADVANCE */}
      {(formData.type === 'FULL_SALARY' || formData.type === 'ADVANCE') && (formData.teacherId || formData.staffId) && (
        <div className="space-y-3">
          {loadingPayments ? (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">To'lovlar yuklanmoqda...</span>
              </div>
            </Card>
          ) : (
            <>
              {/* Monthly Salary & Already Paid Info */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">💰 Oylik Maosh</p>
                    <p className="text-xl font-bold text-blue-600">
                      {(getMonthlySalary() / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {alreadyPaid > 0 ? '✅ Avval Berilgan' : '⏳ Hali Berilmagan'}
                    </p>
                    <p className={`text-xl font-bold ${alreadyPaid > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {(alreadyPaid / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">📊 Qolgan Summa</p>
                    <p className="text-xl font-bold text-orange-600">
                      {(getRemainingAmount() / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {getMonthlySalary() > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, (alreadyPaid / getMonthlySalary()) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {((alreadyPaid / getMonthlySalary()) * 100).toFixed(1)}% to'langan
                    </p>
                  </div>
                )}
              </Card>

              {/* Previous Payments List */}
              {previousPayments.length > 0 && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-green-900">Oldingi To'lovlar</h4>
                  </div>
                  <div className="space-y-2">
                    {previousPayments.map((payment, idx) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-green-200">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {payment.type === 'FULL_SALARY' ? 'Oylik' : payment.type === 'ADVANCE' ? 'Avans' : payment.type}
                          </Badge>
                          {payment.description && (
                            <span className="text-xs text-muted-foreground">{payment.description}</span>
                          )}
                        </div>
                        <span className="font-semibold text-green-600">
                          {(payment.amount / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Overpayment Warning */}
              {wouldExceedLimit() && (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-semibold">
                    ⚠️ OGOHLANTIRISH: Bu to'lov qolgan summadan oshib ketmoqda!
                    <br />
                    <span className="text-sm">
                      Qolgan: {(getRemainingAmount() / 1000000).toFixed(1)}M so'm | 
                      Siz kiritayotgan: {(calculateAmount() / 1000000).toFixed(1)}M so'm
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Info about auto-fill */}
              {formData.type === 'FULL_SALARY' && getRemainingAmount() > 0 && !wouldExceedLimit() && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    💡 Qolgan summa avtomatik to'ldirildi. Kerak bo'lsa o'zgartirishingiz mumkin.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      )}

      {/* Full Salary Components */}
      {formData.type === 'FULL_SALARY' && (
        <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Maosh Tarkibi</h3>
          </div>
          
          <div className="space-y-2">
            <Label>Asosiy Maosh (so'm) *</Label>
            <Input
              type="number"
              min="0"
              step="10000"
              value={formData.baseSalary}
              onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
              required
            />
            <p className="text-xs text-muted-foreground">
              {Number(formData.baseSalary).toLocaleString('uz-UZ')} so'm
            </p>
          </div>

          <div className="space-y-2">
            <Label>Bonus (so'm)</Label>
            <Input
              type="number"
              min="0"
              step="10000"
              value={formData.bonusAmount}
              onChange={(e) => setFormData({ ...formData, bonusAmount: Number(e.target.value) })}
            />
            <p className="text-xs text-green-600">
              + {Number(formData.bonusAmount).toLocaleString('uz-UZ')} so'm
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ushlab Qolish (so'm)</Label>
            <Input
              type="number"
              min="0"
              step="10000"
              value={formData.deductionAmount}
              onChange={(e) => setFormData({ ...formData, deductionAmount: Number(e.target.value) })}
            />
            <p className="text-xs text-red-600">
              - {Number(formData.deductionAmount).toLocaleString('uz-UZ')} so'm
            </p>
          </div>

          <div className="pt-3 border-t-2 border-blue-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-900">Jami To'lov:</span>
              <span className="text-2xl font-bold text-blue-600">
                {calculatedAmount.toLocaleString('uz-UZ')} so'm
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Simple Amount (for other types) */}
      {formData.type !== 'FULL_SALARY' && (
        <div className="space-y-2">
          <Label>Summa (so'm) *</Label>
          <Input
            type="number"
            min="0"
            step="10000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
          />
          <p className="text-sm text-muted-foreground">
            {Number(formData.amount).toLocaleString('uz-UZ')} so'm
          </p>
        </div>
      )}

      {/* Payment Date */}
      <div className="space-y-2">
        <Label>To'lov Sanasi</Label>
        <Input
          type="date"
          value={formData.paymentDate}
          readOnly
          disabled
          className="bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          📅 Avtomatik: Bugungi sana (o'zgartirib bo'lmaydi)
        </p>
      </div>

      {/* Payment Method */}
      {formData.paymentDate && (
        <div className="space-y-2">
          <Label>To'lov Usuli *</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Tanlang..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Naqd pul</SelectItem>
              <SelectItem value="CLICK">Plastik karta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label>Tavsif</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Qo'shimcha ma'lumot..."
          rows={3}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Eslatmalar (Ichki)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Ichki eslatmalar..."
          rows={2}
        />
      </div>

      {/* Summary */}
      <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50/50">
        <h3 className="font-semibold text-green-900 mb-2">Xulosa</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Xodim:</span>
            <span className="font-medium">
              {selectedEmployee 
                ? selectedEmployee.user.fullName
                : 'Tanlanmagan'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Turi:</span>
            <span className="font-medium">
              {formData.type === 'FULL_SALARY' ? 'Oylik Maosh' :
               formData.type === 'ADVANCE' ? 'Avans' :
               formData.type === 'BONUS' ? 'Mukofot' : 'Ushlab Qolish'}
            </span>
          </div>
          {formData.type === 'FULL_SALARY' && (
            <div className="flex justify-between">
              <span>Davr:</span>
              <span className="font-medium">
                {monthNames[formData.month - 1]} {formData.year}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-green-300">
            <span className="font-semibold">Jami Summa:</span>
            <span className="text-lg font-bold text-green-600">
              {(formData.type === 'FULL_SALARY' ? calculatedAmount : formData.amount).toLocaleString('uz-UZ')} so'm
            </span>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1"
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Saqlash
        </Button>
      </div>
    </form>
  )
}
