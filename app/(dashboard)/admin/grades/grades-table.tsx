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
import { Eye, Edit, MoreHorizontal, Award, Download } from 'lucide-react'
import { useAdminPermissions } from '@/components/admin/permissions-provider'
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

interface Grade {
  id: string
  gradeType: string
  score: any
  maxScore: any
  percentage: any
  quarter: number | null
  date: Date
  notes: string | null
  startTime: string | null
  endTime: string | null
  student: {
    studentCode: string
    user: {
      fullName: string
    } | null
    class: {
      name: string
    } | null
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
  group?: {
    name: string
  } | null
}

interface GradesTableProps {
  grades: Grade[]
}

export function GradesTable({ grades }: GradesTableProps) {
  const { can } = useAdminPermissions()
  const canUpdate = can('grades', 'UPDATE')

  const getGradeTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      ORAL: { label: 'Og\'zaki', color: 'bg-blue-100 text-blue-700' },
      WRITTEN: { label: 'Yozma', color: 'bg-green-100 text-green-700' },
      TEST: { label: 'Test', color: 'bg-purple-100 text-purple-700' },
      EXAM: { label: 'Imtihon', color: 'bg-orange-100 text-orange-700' },
      QUARTER: { label: 'Chorak', color: 'bg-indigo-100 text-indigo-700' },
      FINAL: { label: 'Yillik', color: 'bg-pink-100 text-pink-700' },
    }

    const typeInfo = types[type] || { label: type, color: 'bg-gray-100 text-gray-700' }

    return (
      <Badge variant="outline" className={typeInfo.color}>
        {typeInfo.label}
      </Badge>
    )
  }

  const getPercentageBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge className="bg-green-500">A'lo (5)</Badge>
    } else if (percentage >= 70) {
      return <Badge className="bg-blue-500">Yaxshi (4)</Badge>
    } else if (percentage >= 60) {
      return <Badge className="bg-orange-500">Qoniqarli (3)</Badge>
    } else {
      return <Badge className="bg-red-500">Qoniqarsiz (2)</Badge>
    }
  }

  const exportToExcel = () => {
    const ws_data: any[][] = []
    const filename = `baholar_${new Date().toLocaleDateString('uz-UZ')}.xlsx`

    // Header row
    ws_data.push([
      '#', 'O\'quvchi', 'O\'quvchi Kodi', 'Sinf', 'Fan', 'Fan Kodi',
      'Baho Turi', 'Ball', 'Maksimal Ball', 'Foiz', 'Baho', 
      'Chorak', 'Sana', 'Dars Vaqti', 'O\'qituvchi', 'Izoh'
    ])

    // Data rows
    grades.forEach((grade, index) => {
      const percentage = Number(grade.percentage || 0)
      const gradeLevel = percentage >= 90 ? '5 (A\'lo)' : 
                         percentage >= 70 ? '4 (Yaxshi)' : 
                         percentage >= 60 ? '3 (Qoniqarli)' : 
                         '2 (Qoniqarsiz)'
      
      const gradeTypeMap: Record<string, string> = {
        ORAL: 'Og\'zaki',
        WRITTEN: 'Yozma',
        TEST: 'Test',
        EXAM: 'Imtihon',
        QUARTER: 'Chorak',
        FINAL: 'Yillik'
      }

      ws_data.push([
        index + 1,
        grade.student.user?.fullName || 'N/A',
        grade.student.studentCode,
        grade.student.class?.name || grade.group?.name || 'N/A',
        grade.subject.name,
        grade.subject.code,
        gradeTypeMap[grade.gradeType] || grade.gradeType,
        Number(grade.score),
        Number(grade.maxScore),
        percentage.toFixed(1) + '%',
        gradeLevel,
        grade.quarter ? `${grade.quarter}-chorak` : '-',
        new Date(grade.date).toLocaleDateString('uz-UZ'),
        grade.startTime && grade.endTime ? `${grade.startTime}-${grade.endTime}` : '-',
        grade.teacher.user?.fullName || 'N/A',
        grade.notes || '-'
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 10 },
      { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 30 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Baholar')
    XLSX.writeFile(wb, filename)
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Baholar topilmadi</h3>
        <p className="text-muted-foreground mb-4">
          Tanlangan filtrlar uchun baholar mavjud emas
        </p>
        {can('grades', 'CREATE') && (
          <Link href="/admin/grades/mark">
            <Button>
              <Award className="h-4 w-4 mr-2" />
              Baho qo'yish
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex justify-end p-4 border-b bg-muted/30">
        <Button onClick={exportToExcel} className="gap-2" variant="outline">
          <Download className="h-4 w-4" />
          Excel yuklab olish
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>O'quvchi</TableHead>
            <TableHead>Sinf/Guruh</TableHead>
            <TableHead>Fan</TableHead>
            <TableHead>Turi</TableHead>
            <TableHead>Ball</TableHead>
            <TableHead>Baho</TableHead>
            <TableHead>Sana</TableHead>
            <TableHead>O'qituvchi</TableHead>
            <TableHead className="w-[70px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.map((grade, index) => {
            const percentage = Number(grade.percentage || 0)
            
            return (
              <TableRow key={grade.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-semibold">
                      {grade.student.user?.fullName || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {grade.student.studentCode}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  {(grade.student.class || grade.group) && (
                    <Badge variant="outline">
                      {grade.student.class?.name || grade.group?.name}
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{grade.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {grade.subject.code}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  {getGradeTypeBadge(grade.gradeType)}
                </TableCell>

                <TableCell>
                  <div className="text-center">
                    <p className="font-bold text-lg">
                      {Number(grade.score)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {Number(grade.maxScore)}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {getPercentageBadge(percentage)}
                    <p className="text-xs text-muted-foreground text-center">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <p className="text-sm">
                      {new Date(grade.date).toLocaleDateString('uz-UZ')}
                    </p>
                    {grade.quarter && (
                      <p className="text-xs text-muted-foreground">
                        {grade.quarter}-chorak
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-sm truncate max-w-xs">
                    {grade.teacher.user?.fullName || 'N/A'}
                  </p>
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
                        <Link href={`/admin/grades/${grade.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ko'rish
                        </Link>
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/grades/${grade.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Tahrirlash
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

