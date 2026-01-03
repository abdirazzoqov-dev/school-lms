import jsPDF from 'jspdf'

export function generateStudentReport(student: any) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.text('O\'quvchi Hisoboti', 105, 20, { align: 'center' })
  
  // Student Info
  doc.setFontSize(12)
  doc.text(`Ism: ${student.user?.fullName || 'N/A'}`, 20, 40)
  doc.text(`Kod: ${student.studentCode}`, 20, 50)
  doc.text(`Sinf: ${student.class?.name || 'Biriktirilmagan'}`, 20, 60)
  doc.text(`Status: ${student.status}`, 20, 70)
  doc.text(`Tug'ilgan sana: ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('uz-UZ') : 'N/A'}`, 20, 80)
  
  // Attendance Summary
  doc.setFontSize(14)
  doc.text('Davomat', 20, 100)
  doc.setFontSize(12)
  if (student.attendance && student.attendance.length > 0) {
    const present = student.attendance.filter((a: any) => a.status === 'PRESENT').length
    const total = student.attendance.length
    const rate = ((present / total) * 100).toFixed(1)
    doc.text(`Jami: ${total} kun`, 20, 110)
    doc.text(`Kelgan: ${present} kun`, 20, 120)
    doc.text(`Davomat ko'rsatkichi: ${rate}%`, 20, 130)
  } else {
    doc.text('Davomat ma\'lumotlari yo\'q', 20, 110)
  }
  
  // Grade Summary
  doc.setFontSize(14)
  doc.text('Baholar', 20, 150)
  doc.setFontSize(12)
  if (student.grades && student.grades.length > 0) {
    let y = 160
    student.grades.forEach((grade: any, index: number) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const percentage = ((grade.score / grade.maxScore) * 100).toFixed(0)
      doc.text(
        `${index + 1}. ${grade.subject.name}: ${grade.score}/${grade.maxScore} (${percentage}%) - ${grade.gradeType}`,
        20,
        y
      )
      y += 10
    })
  } else {
    doc.text('Baholar ma\'lumotlari yo\'q', 20, 160)
  }
  
  // Footer
  doc.setFontSize(10)
  doc.text(`Yaratilgan: ${new Date().toLocaleString('uz-UZ')}`, 105, 285, { align: 'center' })
  
  return doc
}

export function generateAttendanceReport(data: {
  title: string
  period: string
  students: any[]
  attendanceData: any[]
}) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.text(data.title, 105, 20, { align: 'center' })
  
  // Period
  doc.setFontSize(12)
  doc.text(`Davr: ${data.period}`, 105, 30, { align: 'center' })
  
  // Summary
  doc.setFontSize(14)
  doc.text('Umumiy ma\'lumot', 20, 50)
  doc.setFontSize(12)
  
  const totalDays = data.attendanceData.length
  const totalRecords = data.attendanceData.reduce((sum: number, day: any) => sum + day.total, 0)
  const totalPresent = data.attendanceData.reduce((sum: number, day: any) => sum + day.present, 0)
  const totalAbsent = data.attendanceData.reduce((sum: number, day: any) => sum + day.absent, 0)
  const avgRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0'
  
  doc.text(`Kunlar soni: ${totalDays}`, 20, 60)
  doc.text(`Kelgan: ${totalPresent}`, 20, 70)
  doc.text(`Kelmagan: ${totalAbsent}`, 20, 80)
  doc.text(`O'rtacha davomat: ${avgRate}%`, 20, 90)
  
  // Student list
  doc.setFontSize(14)
  doc.text('O\'quvchilar ro\'yxati', 20, 110)
  doc.setFontSize(10)
  
  let y = 120
  data.students.forEach((student: any, index: number) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(`${index + 1}. ${student.user?.fullName || 'N/A'}`, 20, y)
    y += 7
  })
  
  // Footer
  doc.setFontSize(10)
  doc.text(`Yaratilgan: ${new Date().toLocaleString('uz-UZ')}`, 105, 285, { align: 'center' })
  
  return doc
}

export function generateGradeReport(data: {
  title: string
  period: string
  classInfo: any
  students: any[]
  grades: any[]
}) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.text(data.title, 105, 20, { align: 'center' })
  
  // Period and Class
  doc.setFontSize(12)
  doc.text(`Sinf: ${data.classInfo.name}`, 20, 35)
  doc.text(`Davr: ${data.period}`, 20, 45)
  
  // Grade Summary
  doc.setFontSize(14)
  doc.text('Baholar statistikasi', 20, 60)
  doc.setFontSize(10)
  
  let y = 70
  data.students.forEach((student: any, index: number) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    
    const studentGrades = data.grades.filter((g: any) => g.studentId === student.id)
    const avgScore = studentGrades.length > 0
      ? studentGrades.reduce((sum: number, g: any) => sum + (g.score / g.maxScore), 0) / studentGrades.length * 100
      : 0
    
    doc.text(
      `${index + 1}. ${student.user?.fullName || 'N/A'} - O'rtacha: ${avgScore.toFixed(1)}%`,
      20,
      y
    )
    y += 7
  })
  
  // Footer
  doc.setFontSize(10)
  doc.text(`Yaratilgan: ${new Date().toLocaleString('uz-UZ')}`, 105, 285, { align: 'center' })
  
  return doc
}

