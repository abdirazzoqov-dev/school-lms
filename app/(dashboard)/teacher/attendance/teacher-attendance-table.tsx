'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarCheck, Clock, User, BookOpen, GraduationCap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Attendance = {
  id: string
  date: Date
  startTime: string | null
  endTime: string | null
  status: string
  student: {
    user: {
      fullName: string
      avatar: string | null
    }
    class: {
      name: string
    }
  }
  subject: {
    name: string
  } | null
}

type Props = {
  attendances: Attendance[]
  startDate: Date
  endDate: Date
}

export function TeacherAttendanceTable({ attendances, startDate, endDate }: Props) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PRESENT: { label: 'Kelgan', className: 'bg-green-100 text-green-700 border-green-200' },
      ABSENT: { label: 'Kelmagan', className: 'bg-red-100 text-red-700 border-red-200' },
      LATE: { label: 'Kech kelgan', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      EXCUSED: { label: 'Sababli', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ABSENT

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Davomat Jadvali</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{attendances.length}</p>
            <p className="text-sm text-muted-foreground">ta yozuv</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {attendances.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>O'quvchi</TableHead>
                  <TableHead>Sinf</TableHead>
                  <TableHead>Fan</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Vaqt</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((attendance, index) => (
                  <TableRow 
                    key={attendance.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-purple-200">
                          <AvatarImage src={attendance.student.user.avatar || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                            {getInitials(attendance.student.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{attendance.student.user.fullName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                          <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="font-medium">{attendance.student.class.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendance.subject ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/20">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="font-medium">{attendance.subject.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{formatDate(attendance.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendance.startTime && attendance.endTime ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/20">
                            <Clock className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {attendance.startTime} - {attendance.endTime}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(attendance.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950/20 mb-4">
              <CalendarCheck className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Davomat topilmadi
            </h3>
            <p className="text-muted-foreground max-w-md">
              Tanlangan filter bo'yicha davomat yozuvlari topilmadi. Iltimos, boshqa parametrlarni sinab ko'ring.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

