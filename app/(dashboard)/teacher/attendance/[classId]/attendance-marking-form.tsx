'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createBulkAttendance } from '@/app/actions/attendance'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, Clock, AlertCircle } from 'lucide-react'

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
    email: string | null
  } | null
}

interface ClassData {
  id: string
  name: string
}

interface Attendance {
  id: string
  studentId: string
  status: string
  student: {
    user: {
      fullName: string
    } | null
  }
}

export function AttendanceMarkingForm({ 
  classData, 
  students,
  todayAttendance
}: { 
  classData: ClassData
  students: Student[]
  todayAttendance: Attendance[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')
  const [statuses, setStatuses] = useState<Record<string, string>>({})

  // Initialize with today's attendance if exists
  useEffect(() => {
    if (todayAttendance.length > 0) {
      const initialStatuses: Record<string, string> = {}
      todayAttendance.forEach(attendance => {
        initialStatuses[attendance.studentId] = attendance.status
      })
      setStatuses(initialStatuses)
    } else {
      // Default all to PRESENT
      const defaultStatuses: Record<string, string> = {}
      students.forEach(student => {
        defaultStatuses[student.id] = 'PRESENT'
      })
      setStatuses(defaultStatuses)
    }
  }, [todayAttendance, students])

  const handleStatusChange = (studentId: string, status: string) => {
    setStatuses(prev => ({ ...prev, [studentId]: status }))
  }

  const handleQuickAction = (status: string) => {
    const newStatuses: Record<string, string> = {}
    students.forEach(student => {
      newStatuses[student.id] = status
    })
    setStatuses(newStatuses)
    toast.success(`Barcha o'quvchilar ${
      status === 'PRESENT' ? 'kelgan' : 
      status === 'ABSENT' ? 'kelmagan' :
      status === 'LATE' ? 'kech kelgan' :
      'sababli'
    } deb belgilandi`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that all students have status
    const allHaveStatus = students.every(student => statuses[student.id])
    if (!allHaveStatus) {
      toast.error('Barcha o\'quvchilar uchun statusni belgilang')
      return
    }

    setIsLoading(true)

    try {
      const result = await createBulkAttendance({
        classId: classData.id,
        date,
        notes,
        attendances: students.map(student => ({
          studentId: student.id,
          status: statuses[student.id] as any,
        })),
      })

      if (result.success) {
        toast.success(`${result.count} ta o'quvchi davomati belgilandi`)
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Check className="h-5 w-5 text-green-600" />
      case 'ABSENT':
        return <X className="h-5 w-5 text-red-600" />
      case 'LATE':
        return <Clock className="h-5 w-5 text-orange-600" />
      case 'EXCUSED':
        return <AlertCircle className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 border-green-300'
      case 'ABSENT':
        return 'bg-red-100 border-red-300'
      case 'LATE':
        return 'bg-orange-100 border-orange-300'
      case 'EXCUSED':
        return 'bg-blue-100 border-blue-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const presentCount = Object.values(statuses).filter(s => s === 'PRESENT').length
  const absentCount = Object.values(statuses).filter(s => s === 'ABSENT').length
  const lateCount = Object.values(statuses).filter(s => s === 'LATE').length
  const excusedCount = Object.values(statuses).filter(s => s === 'EXCUSED').length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date and Quick Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <Label htmlFor="date">Sana *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('PRESENT')}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Barchasi kelgan
          </Button>
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('ABSENT')}
            className="text-red-600 hover:text-red-700"
          >
            <X className="mr-2 h-4 w-4" />
            Barchasi kelmagan
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <p className="text-sm text-muted-foreground">Kelgan</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <p className="text-sm text-muted-foreground">Kelmagan</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{lateCount}</div>
          <p className="text-sm text-muted-foreground">Kech kelgan</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{excusedCount}</div>
          <p className="text-sm text-muted-foreground">Sababli</p>
        </div>
      </div>

      {/* Students List */}
      <div className="rounded-md border">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium w-16">#</th>
                <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
                <th className="p-4 text-left text-sm font-medium">Kodi</th>
                <th className="p-4 text-left text-sm font-medium w-64">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student, index) => (
                <tr key={student.id} className={`hover:bg-muted/50 ${getStatusColor(statuses[student.id] || '')}`}>
                  <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {getStatusIcon(statuses[student.id])}
                        {student.user?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">{student.user?.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-sm">{student.studentCode}</code>
                  </td>
                  <td className="p-4">
                    <Select
                      value={statuses[student.id] || 'PRESENT'}
                      onValueChange={(value) => handleStatusChange(student.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            Kelgan
                          </div>
                        </SelectItem>
                        <SelectItem value="ABSENT">
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-600" />
                            Kelmagan
                          </div>
                        </SelectItem>
                        <SelectItem value="LATE">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            Kech kelgan
                          </div>
                        </SelectItem>
                        <SelectItem value="EXCUSED">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            Sababli
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
        <Textarea
          id="notes"
          placeholder="Davomat haqida qo'shimcha ma'lumot..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            'Davomatni saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}

