'use client'

import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { downloadPaymentReceipt, printPaymentReceipt } from '@/lib/pdf-generator'
import { toast } from 'sonner'

interface PaymentPDFButtonProps {
  payment: {
    invoiceNumber: string
    amount: number
    paidAmount?: number | null
    remainingAmount?: number | null
    paymentType: string
    paymentMethod: string
    status: string
    dueDate: Date
    paidDate?: Date | null
    receiptNumber?: string | null
    notes?: string | null
    student?: {
      studentCode?: string
      user?: {
        fullName: string
      }
      class?: {
        name: string
      }
    }
    parent?: {
      user?: {
        fullName: string
        phone?: string | null
      }
    }
    receivedBy?: {
      fullName: string
    }
  }
  schoolName: string
  schoolAddress?: string | null
  schoolPhone?: string | null
}

export function PaymentPDFButton({ payment, schoolName, schoolAddress, schoolPhone }: PaymentPDFButtonProps) {
  const handleDownload = () => {
    try {
      downloadPaymentReceipt({
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        remainingAmount: payment.remainingAmount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate,
        receiptNumber: payment.receiptNumber,
        notes: payment.notes,
        studentName: payment.student?.user?.fullName || 'N/A',
        studentCode: payment.student?.studentCode,
        className: payment.student?.class?.name,
        parentName: payment.parent?.user?.fullName,
        parentPhone: payment.parent?.user?.phone || undefined,
        schoolName,
        schoolAddress: schoolAddress || undefined,
        schoolPhone: schoolPhone || undefined,
        receivedBy: payment.receivedBy?.fullName,
      })
      
      toast.success('PDF muvaffaqiyatli yuklandi!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDF yaratishda xatolik yuz berdi')
    }
  }
  
  const handlePrint = () => {
    try {
      printPaymentReceipt({
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        remainingAmount: payment.remainingAmount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate,
        receiptNumber: payment.receiptNumber,
        notes: payment.notes,
        studentName: payment.student?.user?.fullName || 'N/A',
        studentCode: payment.student?.studentCode,
        className: payment.student?.class?.name,
        parentName: payment.parent?.user?.fullName,
        parentPhone: payment.parent?.user?.phone || undefined,
        schoolName,
        schoolAddress: schoolAddress || undefined,
        schoolPhone: schoolPhone || undefined,
        receivedBy: payment.receivedBy?.fullName,
      })
      
      toast.success('Chop etish oynasi ochildi!')
    } catch (error) {
      console.error('PDF print error:', error)
      toast.error('Chop etishda xatolik yuz berdi')
    }
  }
  
  return (
    <div className="flex gap-2">
      <Button onClick={handleDownload} variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        PDF Yuklash
      </Button>
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="mr-2 h-4 w-4" />
        Chop Etish
      </Button>
    </div>
  )
}

