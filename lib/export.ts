// Utility functions for exporting data to CSV

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${Date.now()}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Format data for CSV export
export function formatStudentsForExport(students: any[]) {
  return students.map(student => ({
    'Kod': student.studentCode,
    'Ism': student.user?.fullName || '',
    'Email': student.user?.email || '',
    'Telefon': student.user?.phone || '',
    'Sinf': student.class?.name || '',
    'Tug\'ilgan sana': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('uz-UZ') : '',
    'Manzil': student.address || '',
    'Status': student.status,
  }))
}

export function formatTeachersForExport(teachers: any[]) {
  return teachers.map(teacher => ({
    'Kod': teacher.teacherCode,
    'Ism': teacher.user?.fullName || '',
    'Email': teacher.user?.email || '',
    'Telefon': teacher.user?.phone || '',
    'Mutaxassislik': teacher.specialization || '',
    'Tajriba': teacher.experienceYears ? `${teacher.experienceYears} yil` : '',
    'Maosh': teacher.salary ? Number(teacher.salary) : '',
  }))
}

export function formatPaymentsForExport(payments: any[]) {
  return payments.map(payment => ({
    'Invoice': payment.invoiceNumber,
    'O\'quvchi': payment.student?.user?.fullName || '',
    'Summasi': Number(payment.amount),
    'To\'langan': payment.paidAmount ? Number(payment.paidAmount) : 0,
    'Qolgan': payment.remainingAmount ? Number(payment.remainingAmount) : 0,
    'Turi': payment.paymentType,
    'Usuli': payment.paymentMethod,
    'Status': payment.status,
    'Muddat': payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('uz-UZ') : '',
    'To\'langan sana': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : '',
  }))
}

