'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { AddPartialSalaryModal } from '@/components/add-partial-salary-modal'
import { SalaryPaymentHistory } from '@/components/salary-payment-history'
import { monthNames } from '@/lib/validations/salary'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SalaryPayment {
  id: string
  amount: any
  paidAmount: any
  remainingAmount: any
  baseSalary?: any // For FULL_SALARY type
  bonusAmount?: any
  deductionAmount?: any
  type: string
  status: string
  month: number | null
  year: number | null
  description: string | null
  notes: string | null
  paymentDate: Date | null
  teacher: {
    id: string
    monthlySalary: any  // O'qituvchining asosiy oylik maoshi
    user: {
      fullName: string
      email: string | null
      phone: string | null
    }
  } | null
  staff: {
    staffCode: string
    position: string
    monthlySalary: any  // Xodimning asosiy oylik maoshi
    user: {
      fullName: string
      email: string | null
      phone: string | null
    }
  } | null
}

interface SalariesTableClientProps {
  salaryPayments: SalaryPayment[]
  groupedByEmployee?: boolean
}

export function SalariesTableClient({ salaryPayments, groupedByEmployee = false }: SalariesTableClientProps) {
  // Group payments by employee and month
  const groupPaymentsByEmployee = () => {
    const grouped = new Map<string, SalaryPayment[]>()
    
    salaryPayments.forEach(payment => {
      const employeeId = payment.teacher?.user.fullName || payment.staff?.user.fullName || 'Unknown'
      const monthYear = `${payment.month}-${payment.year}`
      const key = `${employeeId}-${monthYear}`
      
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(payment)
    })
    
    return Array.from(grouped.values())
  }
  
  const employeeGroups = groupedByEmployee ? groupPaymentsByEmployee() : salaryPayments.map(p => [p])
  const [partialPaymentModal, setPartialPaymentModal] = useState<{
    open: boolean
    payment: SalaryPayment | null
  }>({
    open: false,
    payment: null
  })
  
  const [expandedPayments, setExpandedPayments] = useState<string[]>([])

  const handleAddPartialPayment = (payment: SalaryPayment) => {
    setPartialPaymentModal({
      open: true,
      payment
    })
  }

  const toggleExpand = (paymentId: string) => {
    setExpandedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    )
  }

  const calculateProgress = (payment: SalaryPayment, useEmployeeSalary = false) => {
    // Use teacher.monthlySalary or staff.monthlySalary as reference if available and requested
    const monthlySalary = payment.teacher?.monthlySalary 
      ? Number(payment.teacher.monthlySalary) 
      : payment.staff?.monthlySalary 
        ? Number(payment.staff.monthlySalary) 
        : 0
    const totalAmount = useEmployeeSalary && monthlySalary > 0 ? monthlySalary : Number(payment.amount) || 0
    const paidAmount = Number(payment.paidAmount) || 0
    
    if (totalAmount === 0) return { percentage: 0, paid: 0, total: 0, remaining: 0 }
    
    const percentage = Math.min(Math.round((paidAmount / totalAmount) * 100), 100)
    
    return {
      percentage,
      paid: paidAmount,
      total: totalAmount,
      remaining: totalAmount - paidAmount
    }
  }
  
  // Calculate cumulative progress for grouped payments (relative to monthly salary)
  const calculateGroupProgress = (
    payments: SalaryPayment[], 
    employee?: { monthlySalary: any }
  ) => {
    // Use employee.monthlySalary as 100% reference (if available) - works for both teacher and staff
    const monthlySalary = employee?.monthlySalary ? Number(employee.monthlySalary) : 0
    
    // Calculate base paid (for progress %) - excludes bonus/deduction from FULL_SALARY
    const totalBasePaid = payments.reduce((sum, p) => {
      if (p.type === 'ADVANCE') {
        // Avans counts towards base
        return sum + Number(p.paidAmount || 0)
      } else if (p.type === 'FULL_SALARY') {
        // For FULL_SALARY, use baseSalary if available, otherwise use amount (not paidAmount)
        // This is because baseSalary represents the actual salary portion, not including bonus/deduction
        const baseSalary = (p as any).baseSalary ? Number((p as any).baseSalary) : Number(p.amount || 0)
        return sum + baseSalary
      }
      // BONUS and DEDUCTION don't count towards base progress
      return sum
    }, 0)
    
    // Calculate actual total paid (including bonus/deduction) for display
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
    
    // Fallback: if no employee.monthlySalary, find FULL_SALARY payment or sum all
    let referenceAmount = monthlySalary
    if (referenceAmount === 0) {
      const monthlyPayment = payments.find(p => p.type === 'FULL_SALARY')
      referenceAmount = monthlyPayment ? Number(monthlyPayment.amount) : payments.reduce((sum, p) => sum + Number(p.amount), 0)
    }
    
    if (referenceAmount === 0) return { percentage: 0, paid: 0, total: 0, remaining: 0 }
    
    // Percentage based on base salary paid (not total paid)
    const percentage = Math.min(Math.round((totalBasePaid / referenceAmount) * 100), 100)
    
    return {
      percentage,
      paid: totalPaid, // Show actual amount received
      total: referenceAmount,
      remaining: Math.max(0, referenceAmount - totalBasePaid) // Remaining based on base
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'text-red-600'
    if (percentage < 100) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <>
      <div className="space-y-3">
        {employeeGroups.map((payments, groupIndex) => {
          // For grouped view, use first payment as representative
          const payment = payments[0]
          const employee = payment.teacher ? payment.teacher.user : payment.staff?.user
          const employeeType = payment.teacher ? 'O\'qituvchi' : 'Xodim'
          
          // Calculate progress based on all payments in group
          // Pass teacher or staff to use their monthlySalary as 100% reference
          const employeeData = payment.teacher || payment.staff
          const groupProgress = groupedByEmployee ? calculateGroupProgress(payments, employeeData || undefined) : calculateProgress(payment, true)
          const progress = groupProgress
          
          const isExpanded = expandedPayments.includes(`group-${groupIndex}`)
          const hasHistory = payments.some(p => p.notes && p.notes.includes('['))
          const hasMultiplePayments = payments.length > 1

          return (
            <Collapsible
              key={`group-${groupIndex}`}
              open={isExpanded}
              onOpenChange={() => toggleExpand(`group-${groupIndex}`)}
            >
              <div className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-blue-100 rounded-full shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{employee?.fullName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {employeeType}
                        </Badge>
                        {payment.month && payment.year && (
                          <Badge variant="secondary" className="text-xs">
                            {monthNames[payment.month - 1]} {payment.year}
                          </Badge>
                        )}
                        
                        {/* Show count if multiple payments */}
                        {hasMultiplePayments && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            {payments.length} ta to'lov
                          </Badge>
                        )}
                        
                        {/* Show expand toggle if has multiple payments or history */}
                        {(hasMultiplePayments || hasHistory) && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Yashirish
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Batafsil
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {employee?.email} • {employee?.phone || 'Tel yo\'q'}
                      </p>
                      {payment.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {payment.description}
                        </p>
                      )}

                      {/* Progress Bar - Enhanced with Avans/Qolgan highlight */}
                      {progress.total > 0 && (
                        <div className="mt-4 space-y-2 max-w-md">
                          {/* Progress bar */}
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={progress.percentage} 
                              className="h-3 flex-1 bg-gray-200" 
                            />
                            <span className={`text-base font-bold ${getProgressColor(progress.percentage)}`}>
                              {progress.percentage}%
                            </span>
                          </div>
                          
                          {/* Payment details - highlighted */}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {/* To'langan (Avans) */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                              <p className="text-xs text-green-600 font-medium mb-1">✓ To'langan (Avans)</p>
                              <p className="text-lg font-bold text-green-700">
                                {formatNumber(progress.paid)}
                              </p>
                              <p className="text-xs text-muted-foreground">so'm</p>
                            </div>
                            
                            {/* Qolgan */}
                            {progress.percentage < 100 && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                <p className="text-xs text-orange-600 font-medium mb-1">⏳ Qolgan</p>
                                <p className="text-lg font-bold text-orange-700">
                                  {formatNumber(progress.remaining)}
                                </p>
                                <p className="text-xs text-muted-foreground">so'm</p>
                              </div>
                            )}
                            
                            {/* To'liq to'langan */}
                            {progress.percentage === 100 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <p className="text-xs text-blue-600 font-medium mb-1">✓ To'liq</p>
                                <p className="text-lg font-bold text-blue-700">
                                  {formatNumber(progress.total)}
                                </p>
                                <p className="text-xs text-muted-foreground">so'm</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Jami oylik maosh (100% reference) */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground">Jami oylik maoshi (100%):</span>
                            <span className="font-bold text-blue-700">
                              {formatNumber(progress.total)} so'm
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-2 flex-wrap">
                      {/* Show all payment types if multiple */}
                      {hasMultiplePayments ? (
                        <>
                          {payments.some(p => p.type === 'FULL_SALARY') && (
                            <Badge className="bg-blue-600">Oylik</Badge>
                          )}
                          {payments.some(p => p.type === 'ADVANCE') && (
                            <Badge className="bg-purple-600">Avans</Badge>
                          )}
                          {payments.some(p => p.type === 'BONUS') && (
                            <Badge className="bg-green-600">Mukofot</Badge>
                          )}
                        </>
                      ) : (
                        <>
                          {payment.type === 'FULL_SALARY' && (
                            <Badge className="bg-blue-600">Oylik</Badge>
                          )}
                          {payment.type === 'ADVANCE' && (
                            <Badge className="bg-purple-600">Avans</Badge>
                          )}
                          {payment.type === 'BONUS' && (
                            <Badge className="bg-green-600">Mukofot</Badge>
                          )}
                          {payment.type === 'DEDUCTION' && (
                            <Badge className="bg-red-600">Ushlab qolish</Badge>
                          )}
                        </>
                      )}
                      
                      {/* Status badge based on progress */}
                      {progress.percentage === 100 && (
                        <Badge className="bg-green-600">To'langan</Badge>
                      )}
                      {progress.percentage === 0 && (
                        <Badge className="bg-amber-600">Kutilmoqda</Badge>
                      )}
                      {progress.percentage > 0 && progress.percentage < 100 && (
                        <Badge className="bg-orange-600">Qisman</Badge>
                      )}
                    </div>

                    <p className="text-2xl font-bold mb-2">
                      {formatNumber(progress.total)} so'm
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Oylik maosh (100%)
                    </p>

                    {payment.paymentDate && !hasMultiplePayments && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.paymentDate).toLocaleDateString('uz-UZ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detailed Payments (Collapsible) - Enhanced */}
                {(hasMultiplePayments || hasHistory) && (
                  <CollapsibleContent className="mt-4 pt-4 border-t">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        To'lovlar tafsiloti:
                      </p>
                      {payments.map(p => {
                        // For individual payment breakdown, use payment amount (not teacher salary)
                        const individualProgress = calculateProgress(p, false)
                        return (
                          <div key={p.id} className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {p.type === 'FULL_SALARY' && (
                                    <Badge className="bg-blue-600 text-xs">💼 Oylik</Badge>
                                  )}
                                  {p.type === 'ADVANCE' && (
                                    <Badge className="bg-purple-600 text-xs">💰 Avans</Badge>
                                  )}
                                  {p.type === 'BONUS' && (
                                    <Badge className="bg-green-600 text-xs">🎁 Mukofot</Badge>
                                  )}
                                  {p.type === 'DEDUCTION' && (
                                    <Badge className="bg-red-600 text-xs">⛔ Ushlab qolish</Badge>
                                  )}
                                  
                                  {p.status === 'PAID' && (
                                    <Badge className="bg-green-600 text-xs">✓ To'langan</Badge>
                                  )}
                                  {p.status === 'PENDING' && (
                                    <Badge className="bg-amber-600 text-xs">⏳ Kutilmoqda</Badge>
                                  )}
                                  {p.status === 'PARTIALLY_PAID' && (
                                    <Badge className="bg-orange-600 text-xs">⚡ Qisman</Badge>
                                  )}
                                </div>
                                
                                {/* Amount breakdown */}
                                <div className="grid grid-cols-2 gap-2 max-w-sm">
                                  <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5">
                                    <p className="text-xs text-green-600">To'landi</p>
                                    <p className="text-sm font-bold text-green-700">
                                      {formatNumber(Number(p.paidAmount || 0))}
                                    </p>
                                  </div>
                                  <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
                                    <p className="text-xs text-muted-foreground">Jami</p>
                                    <p className="text-sm font-bold text-gray-700">
                                      {formatNumber(Number(p.amount))}
                                    </p>
                                  </div>
                                </div>

                                {/* Bonus & Deduction for FULL_SALARY */}
                                {p.type === 'FULL_SALARY' && (p.bonusAmount || p.deductionAmount) && (
                                  <div className="grid grid-cols-2 gap-2 max-w-sm mt-2">
                                    {p.bonusAmount && Number(p.bonusAmount) > 0 && (
                                      <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5">
                                        <p className="text-xs text-green-600">🎁 Bonus</p>
                                        <p className="text-sm font-bold text-green-700">
                                          +{formatNumber(Number(p.bonusAmount))}
                                        </p>
                                      </div>
                                    )}
                                    {p.deductionAmount && Number(p.deductionAmount) > 0 && (
                                      <div className="bg-red-50 border-2 border-red-300 rounded px-2 py-1.5">
                                        <p className="text-xs text-red-600">⛔ Ushlab qolish</p>
                                        <p className="text-sm font-bold text-red-700">
                                          -{formatNumber(Number(p.deductionAmount))}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {p.description && (
                                  <p className="text-xs text-muted-foreground mt-2">📝 {p.description}</p>
                                )}
                              </div>
                              
                              {/* Action button */}
                              <div className="text-right">
                                {Number(p.paidAmount || 0) < Number(p.amount) && (
                                  <div className="space-y-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddPartialPayment(p)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      To'lov qo'shish
                                    </Button>
                                    <p className="text-xs text-orange-600 font-medium">
                                      Qoldi: {formatNumber(Number(p.amount) - Number(p.paidAmount || 0))}
                                    </p>
                                  </div>
                                )}
                                {p.paymentDate && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    📅 {new Date(p.paymentDate).toLocaleDateString('uz-UZ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          )
        })}
      </div>

      {/* Partial Payment Modal */}
      {partialPaymentModal.payment && (
        <AddPartialSalaryModal
          open={partialPaymentModal.open}
          onOpenChange={(open) => setPartialPaymentModal({ open, payment: null })}
          payment={{
            id: partialPaymentModal.payment.id,
            amount: Number(partialPaymentModal.payment.amount),
            paidAmount: Number(partialPaymentModal.payment.paidAmount || 0),
            remainingAmount: Number(partialPaymentModal.payment.remainingAmount || partialPaymentModal.payment.amount),
            type: partialPaymentModal.payment.type,
            employeeName: partialPaymentModal.payment.teacher 
              ? partialPaymentModal.payment.teacher.user.fullName 
              : partialPaymentModal.payment.staff?.user.fullName || 'N/A',
            employeeType: partialPaymentModal.payment.teacher ? 'teacher' : 'staff'
          }}
        />
      )}
    </>
  )
}

