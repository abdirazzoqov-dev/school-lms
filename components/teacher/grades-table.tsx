'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

type GradeRecord = {
  id: string
  score: number
  maxScore: number
  gradeType: string
  date: Date
  student: {
    user: { fullName: string } | null
    class: { name: string } | null
  }
  subject: {
    name: string
  }
}

type Props = {
  grades: GradeRecord[]
}

const ITEMS_PER_PAGE = 20

export function GradesTable({ grades }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique classes and subjects
  const { classes, subjects } = useMemo(() => {
    const uniqueClasses = new Set<string>()
    const uniqueSubjects = new Set<string>()
    
    grades.forEach((grade) => {
      if (grade.student.class?.name) {
        uniqueClasses.add(grade.student.class.name)
      }
      uniqueSubjects.add(grade.subject.name)
    })
    
    return {
      classes: Array.from(uniqueClasses).sort(),
      subjects: Array.from(uniqueSubjects).sort()
    }
  }, [grades])

  // Filter grades
  const filteredGrades = useMemo(() => {
    return grades.filter((grade) => {
      // Search filter
      const matchesSearch = grade.student.user?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
      if (searchQuery && !matchesSearch) return false

      // Class filter
      if (classFilter !== 'all' && grade.student.class?.name !== classFilter) {
        return false
      }

      // Subject filter
      if (subjectFilter !== 'all' && grade.subject.name !== subjectFilter) {
        return false
      }

      return true
    })
  }, [grades, searchQuery, classFilter, subjectFilter])

  // Pagination
  const totalPages = Math.ceil(filteredGrades.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedGrades = filteredGrades.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleFilterChange = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="O'quvchi qidirish..."
            value={searchQuery}
            onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
            className="pl-9"
          />
        </div>

        {/* Class Filter */}
        <Select value={classFilter} onValueChange={(value) => handleFilterChange(() => setClassFilter(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Barcha sinflar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sinflar</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Subject Filter */}
        <Select value={subjectFilter} onValueChange={(value) => handleFilterChange(() => setSubjectFilter(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Barcha fanlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha fanlar</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Results count */}
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          {filteredGrades.length} ta natija
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
              <th className="p-4 text-left text-sm font-medium">Sinf</th>
              <th className="p-4 text-left text-sm font-medium">Fan</th>
              <th className="p-4 text-left text-sm font-medium">Turi</th>
              <th className="p-4 text-left text-sm font-medium">Ball</th>
              <th className="p-4 text-left text-sm font-medium">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedGrades.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Ma'lumot topilmadi
                </td>
              </tr>
            ) : (
              paginatedGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div className="font-medium">{grade.student.user?.fullName || 'N/A'}</div>
                  </td>
                  <td className="p-4">{grade.student.class?.name || '-'}</td>
                  <td className="p-4">{grade.subject.name}</td>
                  <td className="p-4">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {grade.gradeType}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${getScoreColor(Number(grade.score), Number(grade.maxScore))}`}>
                      {Number(grade.score)}/{Number(grade.maxScore)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(grade.date).toLocaleDateString('uz-UZ')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, filteredGrades.length)} / {filteredGrades.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Oldingi
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-9 h-9 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Keyingi
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

