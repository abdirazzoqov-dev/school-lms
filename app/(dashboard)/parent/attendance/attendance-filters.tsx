'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
  } | null
  class: {
    name: string
  } | null
}

interface AttendanceFiltersProps {
  children: Student[]
  searchParams: {
    period?: string
    studentId?: string
  }
  selectedStudent: Student
}

export function AttendanceFilters({ children, searchParams, selectedStudent }: AttendanceFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Filterlar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Selection */}
            {children.length > 1 && (
              <div className="space-y-2">
                <Label className="text-xs">Farzand</Label>
                <Select
                  value={searchParams.studentId || children[0].id}
                  onValueChange={(value) => updateSearchParams('studentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        <div className="flex items-center gap-2">
                          <span>{child.user?.fullName || 'N/A'}</span>
                          {child.class && (
                            <Badge variant="outline" className="text-xs">
                              {child.class.name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Period Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Davr</Label>
              <Select
                value={searchParams.period || 'month'}
                onValueChange={(value) => updateSearchParams('period', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">So'ngi hafta</SelectItem>
                  <SelectItem value="month">So'ngi oy</SelectItem>
                  <SelectItem value="year">So'ngi yil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Student Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tanlangan farzand:</p>
                <p className="text-lg font-semibold text-blue-600">
                  {selectedStudent.user?.fullName}
                </p>
              </div>
              {selectedStudent.class && (
                <Badge variant="outline" className="text-sm">
                  {selectedStudent.class.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

