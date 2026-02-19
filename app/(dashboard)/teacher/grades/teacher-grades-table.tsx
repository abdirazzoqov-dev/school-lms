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
import { Award, Clock, User, BookOpen, GraduationCap, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Grade = {
  id: string
  date: Date
  startTime: string | null
  endTime: string | null
  score: number
  maxScore: number
  percentage: number
  type: string
  comments: string | null
  student: {
    user: {
      fullName: string
      avatar: string | null
    }
    class: {
      name: string
    } | null
  }
  subject: {
    name: string
  } | null
  group?: {
    name: string
  } | null
}

type Props = {
  grades: Grade[]
  startDate: Date
  endDate: Date
}

export function TeacherGradesTable({ grades, startDate, endDate }: Props) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 85) {
      return <Badge className="bg-green-100 text-green-700 border-green-200">A'lo</Badge>
    } else if (percentage >= 70) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Yaxshi</Badge>
    } else if (percentage >= 55) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Qoniqarli</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Qoniqarsiz</Badge>
    }
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
              <Award className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Baholar Jadvali</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{grades.length}</p>
            <p className="text-sm text-muted-foreground">ta baho</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {grades.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>O'quvchi</TableHead>
                  <TableHead>Sinf/Guruh</TableHead>
                  <TableHead>Fan</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Vaqt</TableHead>
                  <TableHead>Ball</TableHead>
                  <TableHead>Foiz</TableHead>
                  <TableHead>Daraja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade, index) => (
                  <TableRow 
                    key={grade.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-purple-200">
                          <AvatarImage src={grade.student.user.avatar || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                            {getInitials(grade.student.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{grade.student.user.fullName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                          <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          {grade.student.class?.name || grade.group?.name || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {grade.subject ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/20">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="font-medium">{grade.subject.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{formatDate(grade.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {grade.startTime && grade.endTime ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/20">
                            <Clock className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {grade.startTime} - {grade.endTime}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold">{grade.score}/{grade.maxScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-purple-600">
                        {grade.percentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {getGradeBadge(grade.percentage)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950/20 mb-4">
              <Award className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Baho topilmadi
            </h3>
            <p className="text-muted-foreground max-w-md">
              Tanlangan filter bo'yicha baho yozuvlari topilmadi. Iltimos, boshqa parametrlarni sinab ko'ring.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
