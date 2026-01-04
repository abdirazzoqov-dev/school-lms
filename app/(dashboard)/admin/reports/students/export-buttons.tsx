'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportButtonsProps {
  students: any[]
  byClass: Record<string, number>
  byGrade: Record<number, number>
  stats: {
    total: number
    active: number
    inactive: number
    withParents: number
  }
}

export function ExportButtons({ students, byClass, byGrade, stats }: ExportButtonsProps) {
  const handlePDFExport = () => {
    toast.info('PDF yaratilmoqda...')
    
    try {
      // Create PDF document
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.setTextColor(37, 99, 235) // Blue color
      doc.text("O'QUVCHILAR HISOBOTI", 14, 20)
      
      // Add generation date
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128) // Gray color
      const date = new Date().toLocaleDateString('uz-UZ', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`Yaratilgan: ${date}`, 14, 27)
      
      // Statistics section
      doc.setFontSize(14)
      doc.setTextColor(30, 64, 175) // Dark blue
      doc.text('UMUMIY STATISTIKA', 14, 40)
      
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      let yPos = 48
      
      // Stats boxes
      const statsData = [
        [`Jami o'quvchilar:`, stats.total.toString()],
        [`Faol o'quvchilar:`, stats.active.toString()],
        [`Nofaol o'quvchilar:`, stats.inactive.toString()],
        [`Ota-onasi bor:`, stats.withParents.toString()]
      ]
      
      statsData.forEach(([label, value]) => {
        doc.setTextColor(107, 114, 128)
        doc.text(label, 20, yPos)
        doc.setTextColor(37, 99, 235)
        doc.setFont('helvetica', 'bold')
        doc.text(value, 80, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 7
      })
      
      // Classes table
      yPos += 10
      doc.setFontSize(14)
      doc.setTextColor(30, 64, 175)
      doc.text("SINFLAR BO'YICHA TAQSIMOT", 14, yPos)
      
      const classTableData = Object.entries(byClass).map(([name, count]) => [
        name,
        count.toString()
      ])
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Sinf nomi', "O'quvchilar soni"]],
        body: classTableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [37, 99, 235],
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 10
        },
        columnStyles: {
          1: { halign: 'right', fontStyle: 'bold' }
        }
      })
      
      // Get Y position after table
      yPos = (doc as any).lastAutoTable.finalY + 15
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      // Grade levels table
      doc.setFontSize(14)
      doc.setTextColor(30, 64, 175)
      doc.text("DARAJA BO'YICHA TAQSIMOT", 14, yPos)
      
      const gradeTableData = Object.entries(byGrade)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([grade, count]) => [
          grade === '0' ? 'Biriktirilmagan' : `${grade}-sinf`,
          count.toString()
        ])
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Daraja', "O'quvchilar soni"]],
        body: gradeTableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [37, 99, 235],
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 10
        },
        columnStyles: {
          1: { halign: 'right', fontStyle: 'bold' }
        }
      })
      
      // Add footer on last page
      const pageCount = doc.getNumberOfPages()
      doc.setPage(pageCount)
      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.text(
        `Sahifa ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
      
      // Save PDF
      const fileName = `oquvchilar-hisoboti-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      toast.success('PDF muvaffaqiyatli yuklab olindi!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('PDF yaratishda xatolik yuz berdi')
    }
  }

  const handleExcelExport = () => {
    // Generate CSV content
    const headers = ['ID', 'Ism', 'Email', 'Telefon', 'Sinf', 'Holat']
    const rows = students.map(s => [
      s.id.slice(0, 8),
      s.user?.fullName || 'N/A',
      s.user?.email || 'N/A',
      s.user?.phone || 'N/A',
      s.class?.name || 'Biriktirilmagan',
      s.user?.isActive ? 'Faol' : 'Nofaol'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Add BOM for UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oquvchilar-hisoboti-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('CSV fayl yuklab olindi')
  }

  return (
    <div className="flex gap-3">
      <Button onClick={handlePDFExport}>
        <Download className="h-4 w-4 mr-2" />
        PDF yuklab olish
      </Button>
      <Button variant="outline" onClick={handleExcelExport}>
        <Download className="h-4 w-4 mr-2" />
        CSV yuklab olish
      </Button>
    </div>
  )
}
