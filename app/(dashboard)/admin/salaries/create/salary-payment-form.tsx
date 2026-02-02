'use client'

import { useState } from 'react'
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
import { createSalaryPayment } from '@/app/actions/salary'
import { Loader2, Calculator } from 'lucide-react'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { Badge } from '@/components/ui/badge'

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
  const [employeeType, setEmployeeType] = useState<'teacher' | 'staff'>('teacher')
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
    paymentDate: '',
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
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Bo'sh qoldirsa, "Kutilmoqda" statusida saqlanadi
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
              <SelectItem value="BANK">Bank o'tkazmasi</SelectItem>
              <SelectItem value="CLICK">Click</SelectItem>
              <SelectItem value="PAYME">Payme</SelectItem>
              <SelectItem value="UZUM">Uzum</SelectItem>
              <SelectItem value="OTHER">Boshqa</SelectItem>
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
