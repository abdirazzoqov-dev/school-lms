'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign, Building2, Bed, User, Calendar, CheckCircle2 } from 'lucide-react'
import { addPartialPayment } from '@/app/actions/payment'
import { toast } from 'sonner'

interface DormitoryPaymentsTableProps {
  payments: any[]
}

export function DormitoryPaymentsTable({ payments }: DormitoryPaymentsTableProps) {
  const router = useRouter()
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
  })

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return

    setIsProcessing(true)

    try {
      const result = await addPartialPayment(
        selectedPayment.id,
        parseFloat(paymentData.amount),
        paymentData.paymentMethod,
        paymentData.notes
      )

      if (result.success) {
        toast.success("To'lov qabul qilindi")
        setSelectedPayment(null)
        setPaymentData({ amount: '', paymentMethod: 'CASH', notes: '' })
        router.refresh()
      } else {
        toast.error(result.error || "Xatolik yuz berdi")
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string, dueDate: Date) => {
    const isOverdue = status === 'PENDING' && new Date(dueDate) < new Date()

    if (status === 'COMPLETED') {
      return <Badge className="bg-green-600">To&apos;langan</Badge>
    } else if (isOverdue) {
      return <Badge variant="destructive">Muddati o&apos;tgan</Badge>
    } else {
      return <Badge variant="secondary">Kutilmoqda</Badge>
    }
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">To&apos;lovlar topilmadi</h3>
        <p className="text-muted-foreground">
          Tanlangan filtrlar bo&apos;yicha to&apos;lovlar mavjud emas
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O&apos;quvchi</TableHead>
              <TableHead>Joylashuv</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>To&apos;langan</TableHead>
              <TableHead>Qolgan</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Muddati</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const student = payment.student
              const assignment = student.dormitoryAssignment
              const progress = payment.amount > 0 
                ? (Number(payment.paidAmount || 0) / Number(payment.amount)) * 100 
                : 0

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.user?.fullName || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{student.studentCode}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment ? (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {assignment.room.building.name}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Bed className="h-3 w-3" />
                          {assignment.room.roomNumber}-xona, {assignment.bed.bedNumber}-o&apos;rin
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {Number(payment.amount).toLocaleString('uz-UZ')} so&apos;m
                  </TableCell>
                  <TableCell className="text-green-600">
                    {Number(payment.paidAmount || 0).toLocaleString('uz-UZ')} so&apos;m
                  </TableCell>
                  <TableCell className="text-red-600">
                    {Number(payment.remainingAmount || 0).toLocaleString('uz-UZ')} so&apos;m
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}%</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status, payment.dueDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(payment.dueDate).toLocaleDateString('uz-UZ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status !== 'COMPLETED' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setPaymentData({
                                amount: payment.remainingAmount?.toString() || payment.amount.toString(),
                                paymentMethod: 'CASH',
                                notes: '',
                              })
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            To&apos;lov qabul qilish
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>To&apos;lov qabul qilish</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                              <Label>O&apos;quvchi</Label>
                              <div className="text-sm text-muted-foreground">
                                {selectedPayment?.student.user?.fullName} ({selectedPayment?.student.studentCode})
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="amount">Summa *</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="paymentMethod">To&apos;lov usuli *</Label>
                              <Select
                                value={paymentData.paymentMethod}
                                onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                              >
                                <SelectTrigger id="paymentMethod">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">Naqd</SelectItem>
                                  <SelectItem value="CARD">Karta</SelectItem>
                                  <SelectItem value="TRANSFER">O&apos;tkazma</SelectItem>
                                  <SelectItem value="ONLINE">Online</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="notes">Izoh</Label>
                              <Textarea
                                id="notes"
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedPayment(null)}
                                disabled={isProcessing}
                              >
                                Bekor qilish
                              </Button>
                              <Button type="submit" disabled={isProcessing}>
                                {isProcessing ? "Saqlanmoqda..." : "Saqlash"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

