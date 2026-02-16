'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BookOpen,
  User,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  History
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Grade {
  id: string
  score: number
  maxScore: number
  percentage: number | null
  gradeType: 'ORAL' | 'WRITTEN' | 'TEST' | 'EXAM' | 'QUARTER' | 'FINAL'
  date: Date
  notes: string | null
  quarter: number | null
  subject: {
    id: string
    name: string
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
  grades: Grade[]
}

interface Props {
  students: Student[]
}

export function ParentGradesView({ students }: Props) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '')

  const student = students.find(s => s.id === selectedStudent)
  if (!student) return null

  // Group grades by subject
  const gradesBySubject = student.grades.reduce((acc, grade) => {
    const subjectId = grade.subject.id
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subjectName: grade.subject.name,
        grades: []
      }
    }
    acc[subjectId].grades.push(grade)
    return acc
  }, {} as Record<string, { subjectName: string; grades: Grade[] }>)

  // Calculate subject statistics
  const subjectStats = Object.entries(gradesBySubject).map(([subjectId, data]) => {
    const grades = data.grades
    const sortedByDate = [...grades].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    // Calculate average
    const average = grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length
      : 0

    // Calculate trend (last 3 vs previous 3)
    const recent = sortedByDate.slice(0, 3)
    const previous = sortedByDate.slice(3, 6)
    
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / recent.length
      const previousAvg = previous.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / previous.length
      
      if (recentAvg > previousAvg + 5) trend = 'up'
      else if (recentAvg < previousAvg - 5) trend = 'down'
    }

    // Group by grade type
    const byType = grades.reduce((acc, g) => {
      if (!acc[g.gradeType]) acc[g.gradeType] = []
      acc[g.gradeType].push(g)
      return acc
    }, {} as Record<string, Grade[]>)

    return {
      subjectId,
      subjectName: data.subjectName,
      grades: sortedByDate,
      average,
      trend,
      totalGrades: grades.length,
      byType,
      lastGrade: sortedByDate[0],
      excellentCount: grades.filter(g => (g.score / g.maxScore) * 100 >= 85).length,
      goodCount: grades.filter(g => {
        const pct = (g.score / g.maxScore) * 100
        return pct >= 70 && pct < 85
      }).length,
      weakCount: grades.filter(g => (g.score / g.maxScore) * 100 < 70).length
    }
  }).sort((a, b) => b.average - a.average)

  // Overall statistics
  const overallAverage = subjectStats.length > 0
    ? subjectStats.reduce((sum, s) => sum + s.average, 0) / subjectStats.length
    : 0

  const totalGrades = student.grades.length
  const excellentGrades = student.grades.filter(g => (g.score / g.maxScore) * 100 >= 85).length
  const goodGrades = student.grades.filter(g => {
    const pct = (g.score / g.maxScore) * 100
    return pct >= 70 && pct < 85
  }).length

  const getGradeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ORAL': 'Og\'zaki',
      'WRITTEN': 'Yozma',
      'TEST': 'Test',
      'EXAM': 'Imtihon',
      'QUARTER': 'Chorak',
      'FINAL': 'Yillik'
    }
    return labels[type] || type
  }

  const getGradeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ORAL': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'WRITTEN': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'TEST': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'EXAM': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'QUARTER': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'FINAL': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600 dark:text-green-400'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getPerformanceBg = (percentage: number) => {
    if (percentage >= 85) return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
    if (percentage >= 70) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Baholar
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Farzandlaringizning barcha baholari
        </p>
      </div>

      {/* Student Selector */}
      {students.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudent(s.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedStudent === s.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {s.user?.fullName}
            </button>
          ))}
        </div>
      )}

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{overallAverage.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground font-medium">Umumiy o'rtacha</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalGrades}</div>
                <p className="text-sm text-muted-foreground font-medium">Jami baholar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{excellentGrades}</div>
                <p className="text-sm text-muted-foreground font-medium">A'lo (85%+)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{goodGrades}</div>
                <p className="text-sm text-muted-foreground font-medium">Yaxshi (70-84%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Info Card */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{student.user?.fullName}</h2>
                <p className="text-purple-100">
                  {student.class?.name} • Kod: {student.studentCode}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{subjectStats.length}</div>
              <p className="text-purple-100">Fan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Grades */}
      {subjectStats.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {subjectStats.map((subjectStat) => (
            <Card key={subjectStat.subjectId} className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className={`${getPerformanceBg(subjectStat.average)} border-b-2`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{subjectStat.subjectName}</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`text-3xl font-bold ${getPerformanceColor(subjectStat.average)}`}>
                        {subjectStat.average.toFixed(1)}%
                      </div>
                      {subjectStat.trend === 'up' && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Yaxshilanmoqda
                        </Badge>
                      )}
                      {subjectStat.trend === 'down' && (
                        <Badge className="bg-red-500 hover:bg-red-600">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Pasaymoqda
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <Progress value={subjectStat.average} className="h-2" />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <Tabs defaultValue="stats" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stats">Statistika</TabsTrigger>
                    <TabsTrigger value="history">Tarix</TabsTrigger>
                  </TabsList>

                  <TabsContent value="stats" className="space-y-4 mt-4">
                    {/* Grade Distribution */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                        <div className="text-2xl font-bold text-green-600">{subjectStat.excellentCount}</div>
                        <p className="text-xs text-muted-foreground">A'lo</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                        <div className="text-2xl font-bold text-yellow-600">{subjectStat.goodCount}</div>
                        <p className="text-xs text-muted-foreground">Yaxshi</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <div className="text-2xl font-bold text-red-600">{subjectStat.weakCount}</div>
                        <p className="text-xs text-muted-foreground">Zaif</p>
                      </div>
                    </div>

                    {/* Grades by Type */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Baholar turi bo'yicha:</h4>
                      {Object.entries(subjectStat.byType).map(([type, grades]) => {
                        const typeAverage = grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length
                        return (
                          <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getGradeTypeColor(type)}>
                                {getGradeTypeLabel(type)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{grades.length} ta</span>
                            </div>
                            <span className={`font-bold ${getPerformanceColor(typeAverage)}`}>
                              {typeAverage.toFixed(1)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Last Grade Info */}
                    {subjectStat.lastGrade && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <History className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">Oxirgi baho:</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge className={getGradeTypeColor(subjectStat.lastGrade.gradeType)}>
                              {getGradeTypeLabel(subjectStat.lastGrade.gradeType)}
                            </Badge>
                            <span className="text-lg font-bold">
                              {subjectStat.lastGrade.score}/{subjectStat.lastGrade.maxScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(subjectStat.lastGrade.date).toLocaleDateString('uz-UZ', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                          {subjectStat.lastGrade.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              "{subjectStat.lastGrade.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-2 mt-4 max-h-[400px] overflow-y-auto">
                    {subjectStat.grades.map((grade, index) => {
                      const percentage = (grade.score / grade.maxScore) * 100
                      return (
                        <div
                          key={grade.id}
                          className={`p-3 rounded-lg border-l-4 ${
                            index === 0 ? 'bg-primary/5 border-l-primary' : 'bg-muted/50 border-l-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className={getGradeTypeColor(grade.gradeType)}>
                              {getGradeTypeLabel(grade.gradeType)}
                            </Badge>
                            <span className={`text-xl font-bold ${getPerformanceColor(percentage)}`}>
                              {grade.score}/{grade.maxScore}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(grade.date).toLocaleDateString('uz-UZ', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className={`font-bold ${getPerformanceColor(percentage)}`}>
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                          {grade.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              "{grade.notes}"
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hozircha baholar yo'q</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {student.user?.fullName} uchun hali baholanish boshlanmagan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

