'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, MoreHorizontal, ClipboardCheck, FileDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface Attendance {
  id: string
  date: Date
  status: string
  notes: string | null
  student: {
    studentCode: string
    user: {
      fullName: string
    } | null
  }
  class: {
    name: string
  }
  subject: {
    name: string
    code: string
  }
  teacher: {
    user: {
      fullName: string
    } | null
  }
}

interface AttendanceTableProps {
  attendances: Attendance[]
  period: string
  uniqueDates: string[]
}

export function AttendanceTable({ attendances, period, uniqueDates }: AttendanceTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Kelgan
          </Badge>
        )
      case 'ABSENT':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            Kelmagan
          </Badge>
        )
      case 'LATE':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            Kech keldi
          </Badge>
        )
      case 'EXCUSED':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            Sababli
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Kelgan'
      case 'ABSENT': return 'Kelmagan'
      case 'LATE': return 'Kech keldi'
      case 'EXCUSED': return 'Sababli'
      default: return status
    }
  }

  const exportToExcel = () => {
    if (period === 'week' || period === 'month') {
      // Group by student export
      const groupedByStudent = attendances.reduce((acc, att) => {
        const key = att.student.studentCode
        if (!acc[key]) {
          acc[key] = {
            student: att.student,
            class: att.class,
            records: [],
          }
        }
        acc[key].records.push(att)
        return acc
      }, {} as Record<string, { student: any; class: any; records: Attendance[] }>)

      const excelData = Object.values(groupedByStudent).map((item, index) => {
        const present = item.records.filter(r => r.status === 'PRESENT').length
        const absent = item.records.filter(r => r.status === 'ABSENT').length
        const late = item.records.filter(r => r.status === 'LATE').length
        const excused = item.records.filter(r => r.status === 'EXCUSED').length
        const total = item.records.length
        const attendanceRate = total > 0 ? (present / total) * 100 : 0

        return {
          '#': index + 1,
          "O'quvchi": item.student.user?.fullName || 'N/A',
          "O'quvchi Kodi": item.student.studentCode,
          'Sinf': item.class.name,
          'Kelgan': present,
          'Kelmagan': absent,
          'Kech': late,
          'Sababli': excused,
          'Jami': total,
          'Foiz': `${attendanceRate.toFixed(1)}%`
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Davomat')
      
      const fileName = `davomat_${period}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
    } else {
      // Day view export
      const excelData = attendances.map((att, index) => ({
        '#': index + 1,
        "O'quvchi": att.student.user?.fullName || 'N/A',
        "O'quvchi Kodi": att.student.studentCode,
        'Sinf': att.class.name,
        'Fan': att.subject.name,
        'Fan Kodi': att.subject.code,
        "O'qituvchi": att.teacher.user?.fullName || 'N/A',
        'Holat': getStatusText(att.status),
        'Sana': new Date(att.date).toLocaleDateString('uz-UZ'),
        'Izoh': att.notes || '-'
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Davomat')
      
      const fileName = `davomat_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
    }
  }

  if (attendances.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Davomat yozuvlari yo'q</h3>
        <p className="text-muted-foreground mb-4">
          Tanlangan filtrlar uchun davomat yozuvlari topilmadi
        </p>
        <Link href="/admin/attendance/mark">
          <Button>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Davomat belgilash
          </Button>
        </Link>
      </div>
    )
  }

  // Group by student for multi-day view
  if (period === 'week' || period === 'month') {
    // Group attendances by student
    const groupedByStudent = attendances.reduce((acc, att) => {
      const key = att.student.studentCode
      if (!acc[key]) {
        acc[key] = {
          student: att.student,
          class: att.class,
          records: [],
        }
      }
      acc[key].records.push(att)
      return acc
    }, {} as Record<string, { student: any; class: any; records: Attendance[] }>)

    return (
      <div className="space-y-4">
        {/* Excel Export Button */}
        <div className="flex justify-end">
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Excel yuklab olish
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>O'quvchi</TableHead>
                <TableHead>Sinf</TableHead>
                <TableHead>Kelgan</TableHead>
                <TableHead>Kelmagan</TableHead>
                <TableHead>Kech</TableHead>
                <TableHead>Sababli</TableHead>
                <TableHead>Foiz</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {Object.values(groupedByStudent).map((item, index) => {
              const present = item.records.filter(r => r.status === 'PRESENT').length
              const absent = item.records.filter(r => r.status === 'ABSENT').length
              const late = item.records.filter(r => r.status === 'LATE').length
              const excused = item.records.filter(r => r.status === 'EXCUSED').length
              const total = item.records.length
              const attendanceRate = total > 0 ? (present / total) * 100 : 0

              return (
                <TableRow key={item.student.studentCode}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">
                        {item.student.user?.fullName || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.student.studentCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.class.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">{present}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-red-600">{absent}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-orange-600">{late}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-blue-600">{excused}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">
                        {attendanceRate.toFixed(1)}%
                      </p>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            attendanceRate >= 80
                              ? 'bg-green-500'
                              : attendanceRate >= 60
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      </div>
    )
  }

  // Day view - detailed records
  return (
    <div className="space-y-4">
      {/* Excel Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToExcel} variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Excel yuklab olish
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>O'quvchi</TableHead>
            <TableHead>Sinf</TableHead>
            <TableHead>Fan</TableHead>
            <TableHead>O'qituvchi</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Izoh</TableHead>
            <TableHead className="w-[70px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendances.map((attendance, index) => (
            <TableRow key={attendance.id} className="hover:bg-muted/50">
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-semibold">
                    {attendance.student.user?.fullName || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {attendance.student.studentCode}
                  </p>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline">{attendance.class.name}</Badge>
              </TableCell>

              <TableCell>
                <div>
                  <p className="text-sm font-medium">{attendance.subject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attendance.subject.code}
                  </p>
                </div>
              </TableCell>

              <TableCell>
                <p className="text-sm">
                  {attendance.teacher.user?.fullName || 'N/A'}
                </p>
              </TableCell>

              <TableCell>{getStatusBadge(attendance.status)}</TableCell>

              <TableCell>
                {attendance.notes ? (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {attendance.notes}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/attendance/${attendance.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ko'rish
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/attendance/${attendance.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Tahrirlash
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </div>
  )
}

