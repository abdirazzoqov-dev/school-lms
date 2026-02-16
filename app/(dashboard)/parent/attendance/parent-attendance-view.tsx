'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Target,
  Activity,
  BookOpen,
  AlertCircle,
  Info
} from 'lucide-react'

interface Attendance {
  id: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  date: Date
  startTime: string | null
  endTime: string | null
  notes: string | null
  subject: {
    id: string
    name: string
    code: string | null
  }
  teacher: {
    user: {
      fullName: string
    }
  }
}

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
    avatar: string | null
  } | null
  class: {
    name: string
  } | null
}

interface Props {
  students: Student[]
  selectedStudent: Student
  attendances: Attendance[]
  period: 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
}

export function ParentAttendanceView({
  students,
  selectedStudent,
  attendances,
  period,
  startDate,
  endDate,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview')

  // Overall stats
  const totalRecords = attendances.length
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length
  const lateCount = attendances.filter(a => a.status === 'LATE').length
  const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length
  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

  // Group by subject
  const subjectStats = attendances.reduce((acc, att) => {
    const subjectId = att.subject.id
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subjectName: att.subject.name,
        subjectCode: att.subject.code,
        attendances: [],
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        consecutivePresentStreak: 0,
        consecutiveAbsentStreak: 0,
        lastAttendance: null as Attendance | null,
      }
    }
    acc[subjectId].attendances.push(att)
    acc[subjectId].total++
    if (att.status === 'PRESENT') acc[subjectId].present++
    if (att.status === 'ABSENT') acc[subjectId].absent++
    if (att.status === 'LATE') acc[subjectId].late++
    if (att.status === 'EXCUSED') acc[subjectId].excused++
    
    return acc
  }, {} as Record<string, {
    subjectName: string
    subjectCode: string | null
    attendances: Attendance[]
    total: number
    present: number
    absent: number
    late: number
    excused: number
    consecutivePresentStreak: number
    consecutiveAbsentStreak: number
    lastAttendance: Attendance | null
  }>)

  // Calculate streaks and trends for each subject
  Object.values(subjectStats).forEach(stat => {
    // Sort by date descending
    const sorted = [...stat.attendances].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    stat.lastAttendance = sorted[0] || null
    
    // Calculate consecutive present streak
    let presentStreak = 0
    for (const att of sorted) {
      if (att.status === 'PRESENT') {
        presentStreak++
      } else {
        break
      }
    }
    stat.consecutivePresentStreak = presentStreak
    
    // Calculate consecutive absent streak
    let absentStreak = 0
    for (const att of sorted) {
      if (att.status === 'ABSENT') {
        absentStreak++
      } else {
        break
      }
    }
    stat.consecutiveAbsentStreak = absentStreak
  })

  // Sort subjects by attendance rate
  const sortedSubjects = Object.entries(subjectStats).sort((a, b) => {
    const rateA = a[1].total > 0 ? (a[1].present / a[1].total) * 100 : 0
    const rateB = b[1].total > 0 ? (b[1].present / b[1].total) * 100 : 0
    return rateB - rateA
  })

  // Find problematic subjects (low attendance)
  const problematicSubjects = sortedSubjects.filter(([_, stat]) => {
    const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
    return rate < 75 || stat.consecutiveAbsentStreak >= 2
  })

  // Find excellent subjects (high attendance)
  const excellentSubjects = sortedSubjects.filter(([_, stat]) => {
    const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
    return rate >= 90
  })

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { label: 'A\'lo', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900' }
    if (rate >= 75) return { label: 'Yaxshi', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900' }
    if (rate >= 60) return { label: 'O\'rta', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900' }
    return { label: 'Past', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900' }
  }

  const performance = getPerformanceLevel(attendanceRate)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'short'
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Farzandlarim Davomati
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Farzandlaringiz davomati haqida ma'lumot
        </p>
      </div>

      {/* Student Selector */}
      <div className="flex flex-wrap gap-3">
        {students.map((student) => (
          <Link
            key={student.id}
            href={`?studentId=${student.id}&period=${period}`}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              selectedStudent.id === student.id
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {student.user?.fullName}
          </Link>
        ))}
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-3">
        {['week', 'month', 'year'].map((p) => (
          <Link
            key={p}
            href={`?studentId=${selectedStudent.id}&period=${p}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {p === 'week' ? 'So\'nggi hafta' : p === 'month' ? 'So\'nggi oy' : 'So\'nggi yil'}
          </Link>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{attendanceRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground font-medium">Davomat foizi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
                <p className="text-sm text-muted-foreground font-medium">Jami darslar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{presentCount}</div>
                <p className="text-sm text-muted-foreground font-medium">Qatnashdi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{absentCount}</div>
                <p className="text-sm text-muted-foreground font-medium">Dars qoldirdi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">{lateCount}</div>
                <p className="text-sm text-muted-foreground font-medium">Kech qoldi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Card */}
      <Card className={`border-2 shadow-lg ${performance.bg} ${performance.border}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-white/50 dark:bg-black/20">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedStudent.user?.fullName}</h2>
                <p className="text-muted-foreground">
                  {selectedStudent.class?.name} • Kod: {selectedStudent.studentCode}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`text-xl px-4 py-2 ${performance.color} bg-white dark:bg-black/20`}>
                {performance.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{attendanceRate.toFixed(1)}% davomat</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <Progress value={attendanceRate} className="h-3" />
            <div className="flex justify-between text-xs mt-2 text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts for problematic subjects */}
      {problematicSubjects.length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-900 dark:text-red-100">E'tibor Talab Qiladi!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {problematicSubjects.map(([subjectId, stat]) => {
                const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
                return (
                  <div key={subjectId} className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg">
                    <div>
                      <p className="font-semibold">{stat.subjectName}</p>
                      {stat.consecutiveAbsentStreak >= 2 && (
                        <p className="text-sm text-red-600">
                          Ketma-ket {stat.consecutiveAbsentStreak} dars qoldirdi
                        </p>
                      )}
                      {rate < 75 && (
                        <p className="text-sm text-orange-600">
                          Davomat {rate.toFixed(1)}% - standartdan past
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">{rate.toFixed(1)}%</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excellent performance highlight */}
      {excellentSubjects.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-900 dark:text-green-100">A'lo Davomat!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {excellentSubjects.map(([subjectId, stat]) => {
                const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
                return (
                  <Badge key={subjectId} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
                    {stat.subjectName}: {rate.toFixed(1)}%
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects Detailed View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Fanlar Bo'yicha Davomat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Barchasi</TabsTrigger>
              <TabsTrigger value="problems">
                Muammoli {problematicSubjects.length > 0 && `(${problematicSubjects.length})`}
              </TabsTrigger>
              <TabsTrigger value="excellent">
                A'lo {excellentSubjects.length > 0 && `(${excellentSubjects.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {sortedSubjects.map(([subjectId, stat]) => {
                const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
                const perf = getPerformanceLevel(rate)
                
                return (
                  <div key={subjectId} className={`p-4 rounded-lg border-2 ${perf.bg} ${perf.border}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{stat.subjectName}</h3>
                        {stat.subjectCode && (
                          <p className="text-sm text-muted-foreground">{stat.subjectCode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${perf.color}`}>{rate.toFixed(1)}%</div>
                        <Badge variant="outline" className={perf.color}>
                          {perf.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 rounded bg-white dark:bg-black/20">
                        <div className="text-xl font-bold text-green-600">{stat.present}</div>
                        <p className="text-xs text-muted-foreground">Kelgan</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white dark:bg-black/20">
                        <div className="text-xl font-bold text-red-600">{stat.absent}</div>
                        <p className="text-xs text-muted-foreground">Kelmagan</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white dark:bg-black/20">
                        <div className="text-xl font-bold text-orange-600">{stat.late}</div>
                        <p className="text-xs text-muted-foreground">Kech</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white dark:bg-black/20">
                        <div className="text-xl font-bold text-blue-600">{stat.total}</div>
                        <p className="text-xs text-muted-foreground">Jami</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <Progress value={rate} className="h-2 mb-3" />

                    {/* Insights */}
                    <div className="flex flex-wrap gap-2">
                      {stat.consecutivePresentStreak >= 3 && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {stat.consecutivePresentStreak} dars ketma-ket qatnashdi
                        </Badge>
                      )}
                      {stat.consecutiveAbsentStreak >= 2 && (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {stat.consecutiveAbsentStreak} dars ketma-ket qoldirdi
                        </Badge>
                      )}
                      {stat.lastAttendance && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Oxirgi: {formatShortDate(stat.lastAttendance.date)} 
                          {stat.lastAttendance.status === 'PRESENT' && ' ✓'}
                          {stat.lastAttendance.status === 'ABSENT' && ' ✗'}
                        </Badge>
                      )}
                    </div>

                    {/* Notes if recent absence */}
                    {stat.lastAttendance?.status === 'ABSENT' && stat.lastAttendance.notes && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          <Info className="h-3 w-3 inline mr-1" />
                          {stat.lastAttendance.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="problems" className="space-y-4 mt-4">
              {problematicSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-green-600">Muammoli fanlar yo'q!</p>
                  <p className="text-muted-foreground">Barcha fanlarda davomat yaxshi</p>
                </div>
              ) : (
                problematicSubjects.map(([subjectId, stat]) => {
                  const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
                  
                  return (
                    <div key={subjectId} className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold">{stat.subjectName}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {stat.consecutiveAbsentStreak >= 2 && (
                              <Badge variant="destructive" className="text-xs">
                                {stat.consecutiveAbsentStreak} dars ketma-ket qoldirdi
                              </Badge>
                            )}
                            {rate < 75 && (
                              <Badge variant="destructive" className="text-xs">
                                Davomat {rate.toFixed(1)}% - past
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600">{rate.toFixed(1)}%</div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Tavsiyalar:</p>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                          {rate < 60 && <li>Darhol o'qituvchi bilan bog'laning</li>}
                          {stat.consecutiveAbsentStreak >= 2 && <li>Qoldirilgan darslarni qoplashtiring</li>}
                          {rate < 75 && <li>Keyingi darsda albatta qatnashing</li>}
                        </ul>
                      </div>
                    </div>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="excellent" className="space-y-4 mt-4">
              {excellentSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">90%+ davomat bilan fanlar yo'q</p>
                  <p className="text-muted-foreground">Davomatni yaxshilash ustida ishlang</p>
                </div>
              ) : (
                excellentSubjects.map(([subjectId, stat]) => {
                  const rate = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
                  
                  return (
                    <div key={subjectId} className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-green-900 dark:text-green-100">{stat.subjectName}</h3>
                          {stat.consecutivePresentStreak >= 3 && (
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              🎉 {stat.consecutivePresentStreak} dars ketma-ket qatnashdi!
                            </p>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-green-600">{rate.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      {attendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              So'nggi Davomat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {attendances.slice(0, 10).map((att) => (
                <div
                  key={att.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    att.status === 'PRESENT'
                      ? 'bg-green-50 dark:bg-green-950/20 border-l-green-500'
                      : att.status === 'ABSENT'
                      ? 'bg-red-50 dark:bg-red-950/20 border-l-red-500'
                      : att.status === 'LATE'
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-l-orange-500'
                      : 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{att.subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(att.date)}
                        {att.startTime && att.endTime && ` • ${att.startTime} - ${att.endTime}`}
                      </p>
                    </div>
                    <Badge
                      className={
                        att.status === 'PRESENT'
                          ? 'bg-green-600 hover:bg-green-700'
                          : att.status === 'ABSENT'
                          ? 'bg-red-600 hover:bg-red-700'
                          : att.status === 'LATE'
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }
                    >
                      {att.status === 'PRESENT' && 'Qatnashdi'}
                      {att.status === 'ABSENT' && 'Qoldirdi'}
                      {att.status === 'LATE' && 'Kech qoldi'}
                      {att.status === 'EXCUSED' && 'Sababli'}
                    </Badge>
                  </div>
                  {att.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{att.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {attendances.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Davomat ma'lumotlari yo'q</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Tanlangan davr uchun davomat ma'lumotlari topilmadi
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

