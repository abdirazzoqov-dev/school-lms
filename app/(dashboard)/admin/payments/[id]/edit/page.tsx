'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updatePayment } from '@/app/actions/payment'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [formData, setFormData] = useState({
    studentId: '',
    amount: 0,
    paymentType: 'TUITION' as 'TUITION' | 'BOOKS' | 'UNIFORM' | 'OTHER',
    paymentMethod: 'CASH' as 'CASH' | 'CLICK' | 'PAYME' | 'UZUM',
    dueDate: '',
    paidDate: '',
    receiptNumber: '',
    notes: '',
  })

  useEffect(() => {
    // Load payment data
    fetch(`/api/payments/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.payment) {
          setPaymentInfo(data.payment)
          setFormData({
            studentId: data.payment.studentId,
            amount: Number(data.payment.amount),
            paymentType: data.payment.paymentType,
            paymentMethod: data.payment.paymentMethod,
            dueDate: data.payment.dueDate 
              ? new Date(data.payment.dueDate).toISOString().split('T')[0]
              : '',
            paidDate: data.payment.paidDate 
              ? new Date(data.payment.paidDate).toISOString().split('T')[0]
              : '',
            receiptNumber: data.payment.receiptNumber || '',
            notes: data.payment.notes || '',
          })
        }
        setDataLoading(false)
      })
      .catch(() => {
        toast({
          title: 'Xato!',
          description: 'Ma\'lumotlarni yuklashda xatolik',
          variant: 'destructive',
        })
        setDataLoading(false)
      })
  }, [params.id, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updatePayment(params.id, formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'To\'lov ma\'lumotlari yangilandi',
        })
        router.push('/admin/payments')
      } else {
        toast({
          title: 'Xato!',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">To'lovni Tahrirlash</h2>
          <p className="text-muted-foreground">To'lov ma'lumotlarini yangilang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            To'lov Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Invoice: {paymentInfo?.invoiceNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student info - readonly */}
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-medium mb-1">O'quvchi</p>
              <p className="text-sm">{paymentInfo?.student?.user?.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {paymentInfo?.student?.class?.name} - {paymentInfo?.student?.studentCode}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentType">To'lov Turi *</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value: 'TUITION' | 'BOOKS' | 'UNIFORM' | 'OTHER') =>
                    setFormData(prev => ({ ...prev, paymentType: value }))
                  }
                >
                  <SelectTrigger>
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
                  min="1"
                  placeholder="Masalan: 500000"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">To'lov Usuli *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'CASH' | 'CLICK' | 'PAYME' | 'UZUM') =>
                    setFormData(prev => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Naqd pul</SelectItem>
                    <SelectItem value="CLICK" disabled>Click (keyinroq)</SelectItem>
                    <SelectItem value="PAYME" disabled>Payme (keyinroq)</SelectItem>
                    <SelectItem value="UZUM" disabled>Uzum (keyinroq)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Muddat *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidDate">To'langan Sana</Label>
                <Input
                  id="paidDate"
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidDate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Agar to'langan bo'lsa, sanani kiriting
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Kvitansiya Raqami</Label>
                <Input
                  id="receiptNumber"
                  placeholder="RCP202401001"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Izoh</Label>
              <Textarea
                id="notes"
                placeholder="Qo'shimcha ma'lumotlar..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/payments">
                <Button type="button" variant="outline">
                  Bekor qilish
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Saqlash
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • To'langan sana kiritilsa, status avtomatik COMPLETED bo'ladi
          </p>
          <p>
            • Invoice number o'zgartirilmaydi
          </p>
          <p>
            • O'quvchini o'zgartirib bo'lmaydi (yangi to'lov yarating)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

