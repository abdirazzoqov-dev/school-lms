'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { downloadPaymentReceipt } from '@/lib/pdf-generator'
import { toast } from 'sonner'

interface PaymentQuickPDFProps {
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
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function PaymentQuickPDF({ 
  payment, 
  schoolName, 
  schoolAddress, 
  schoolPhone,
  variant = 'ghost',
  size = 'sm'
}: PaymentQuickPDFProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    
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
      
      toast.success('PDF yuklanmoqda...')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDF yaratishda xatolik')
    }
  }
  
  return (
    <Button 
      onClick={handleDownload} 
      variant={variant} 
      size={size}
      title="PDF yuklash"
    >
      <FileDown className="h-4 w-4" />
    </Button>
  )
}

