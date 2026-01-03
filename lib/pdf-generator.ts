import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatNumber } from './utils'

interface PaymentReceiptData {
  // Payment info
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
  
  // Student info
  studentName: string
  studentCode?: string
  className?: string
  
  // Parent info
  parentName?: string
  parentPhone?: string
  
  // School info
  schoolName: string
  schoolAddress?: string
  schoolPhone?: string
  schoolLogo?: string
  
  // Received by
  receivedBy?: string
}

export function generatePaymentReceipt(data: PaymentReceiptData): jsPDF {
  const doc = new jsPDF()
  
  // Colors
  const primaryColor = [37, 99, 235] // Blue
  const successColor = [34, 197, 94] // Green
  const textColor = [55, 65, 81] // Gray
  
  let yPos = 20
  
  // Header - School Logo and Name
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(data.schoolName, 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (data.schoolAddress) {
    doc.text(data.schoolAddress, 105, 28, { align: 'center' })
  }
  if (data.schoolPhone) {
    doc.text(`Tel: ${data.schoolPhone}`, 105, 34, { align: 'center' })
  }
  
  yPos = 50
  
  // Title
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text("TO'LOV KVITANSIYASI", 105, yPos, { align: 'center' })
  yPos += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice: ${data.invoiceNumber}`, 105, yPos, { align: 'center' })
  yPos += 15
  
  // Status Badge
  if (data.status === 'COMPLETED') {
    doc.setFillColor(successColor[0], successColor[1], successColor[2])
    doc.setTextColor(255, 255, 255)
    doc.roundedRect(80, yPos - 5, 50, 8, 2, 2, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text("TO'LANGAN", 105, yPos, { align: 'center' })
    yPos += 12
  }
  
  // Student Information
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text("O'quvchi Ma'lumotlari:", 20, yPos)
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const studentInfo = [
    ['Ism-familiya:', data.studentName],
    ['O\'quvchi kodi:', data.studentCode || 'N/A'],
    ['Sinf:', data.className || 'N/A'],
  ]
  
  studentInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPos)
    yPos += 6
  })
  
  yPos += 5
  
  // Parent Information (if exists)
  if (data.parentName) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text("Ota-ona Ma'lumotlari:", 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const parentInfo = [
      ['Ism-familiya:', data.parentName],
      ['Telefon:', data.parentPhone || 'N/A'],
    ]
    
    parentInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 60, yPos)
      yPos += 6
    })
    
    yPos += 5
  }
  
  // Payment Details Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text("To'lov Tafsilotlari:", 20, yPos)
  yPos += 5
  
  const paymentTypeLabels: Record<string, string> = {
    'TUITION': "O'qish haqi",
    'BOOKS': 'Kitoblar',
    'UNIFORM': 'Forma',
    'TRANSPORT': 'Transport',
    'MEALS': 'Ovqatlanish',
    'EXAM': 'Imtihon',
    'OTHER': 'Boshqa'
  }
  
  const paymentMethodLabels: Record<string, string> = {
    'CASH': 'Naqd',
    'CARD': 'Karta',
    'BANK_TRANSFER': 'Bank o\'tkazmasi',
    'ONLINE': 'Online'
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Ma\'lumot', 'Qiymat']],
    body: [
      ['Maqsad', paymentTypeLabels[data.paymentType] || data.paymentType],
      ['To\'lov usuli', paymentMethodLabels[data.paymentMethod] || data.paymentMethod],
      ['Jami summa', `${formatNumber(data.amount)} so'm`],
      ...(data.paidAmount ? [['To\'langan', `${formatNumber(data.paidAmount)} so'm`]] : []),
      ...(data.remainingAmount ? [['Qoldiq', `${formatNumber(data.remainingAmount)} so'm`]] : []),
      ['Muddat', new Date(data.dueDate).toLocaleDateString('uz-UZ')],
      ...(data.paidDate ? [['To\'langan sana', new Date(data.paidDate).toLocaleDateString('uz-UZ')]] : []),
      ...(data.receiptNumber ? [['Chek raqami', data.receiptNumber]] : []),
    ],
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor,
      fontSize: 11,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 }
    }
  })
  
  // @ts-ignore - autoTable adds finalY to doc
  yPos = doc.lastAutoTable.finalY + 10
  
  // Notes (if exists)
  if (data.notes) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Izoh:', 20, yPos)
    yPos += 6
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(data.notes, 170)
    doc.text(splitNotes, 20, yPos)
    yPos += (splitNotes.length * 5) + 10
  } else {
    yPos += 5
  }
  
  // Signatures
  yPos += 10
  
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, 90, yPos)
  doc.line(120, yPos, 190, yPos)
  
  yPos += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Qabul qildi:', 20, yPos)
  doc.text('To\'lovchi:', 120, yPos)
  
  if (data.receivedBy) {
    yPos += 5
    doc.setFont('helvetica', 'italic')
    doc.text(data.receivedBy, 20, yPos)
  }
  
  // Footer
  yPos = 280
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'italic')
  const footerText = `Kvitansiya yaratilgan: ${new Date().toLocaleString('uz-UZ')}`
  doc.text(footerText, 105, yPos, { align: 'center' })
  
  return doc
}

export function downloadPaymentReceipt(data: PaymentReceiptData, filename?: string) {
  const doc = generatePaymentReceipt(data)
  const fileName = filename || `kvitansiya-${data.invoiceNumber}.pdf`
  doc.save(fileName)
}

export function printPaymentReceipt(data: PaymentReceiptData) {
  const doc = generatePaymentReceipt(data)
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}

