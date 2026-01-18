'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createSchedule } from '@/app/actions/schedule'
import { Loader2 } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/validations/schedule'

interface ScheduleFormProps {
  classes: Array<{ id: string; name: string }>
  groups: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
  teachers: Array<{ id: string; user: { fullName: string } }>
  academicYear: string
}

export function ScheduleForm({ classes, groups, subjects, teachers, academicYear }: ScheduleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [assignmentType, setAssignmentType] = useState<'class' | 'group'>('class')
  const [formData, setFormData] = useState({
    classId: '',
    groupId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '08:45',
    roomNumber: '',
    academicYear: academicYear
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const scheduleData = {
        ...formData,
        dayOfWeek: parseInt(formData.dayOfWeek),
        type: assignmentType
      }

      const result = await createSchedule(scheduleData)

      if (result.success) {
        toast.success('Dars jadvali qo\'shildi')
        router.push(`/admin/schedules?type=${assignmentType}`)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assignment Type Selection */}
      <div className="space-y-2">
        <Label>Turi *</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="type-class"
              name="assignmentType"
              value="class"
              checked={assignmentType === 'class'}
              onChange={() => {
                setAssignmentType('class')
                setFormData({ ...formData, groupId: '' })
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="type-class" className="font-normal cursor-pointer">
              Sinfga dars qo'shish
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="type-group"
              name="assignmentType"
              value="group"
              checked={assignmentType === 'group'}
              onChange={() => {
                setAssignmentType('group')
                setFormData({ ...formData, classId: '' })
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="type-group" className="font-normal cursor-pointer">
              Guruhga dars qo'shish
            </Label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Class or Group Selection */}
        {assignmentType === 'class' ? (
          <div>
            <Label htmlFor="classId">Sinf *</Label>
            <Select
              value={formData.classId}
              onValueChange={(value) => setFormData({ ...formData, classId: value })}
              required
            >
              <SelectTrigger id="classId">
                <SelectValue placeholder="Sinf tanlang" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <Label htmlFor="groupId">Guruh *</Label>
            <Select
              value={formData.groupId}
              onValueChange={(value) => setFormData({ ...formData, groupId: value })}
              required
            >
              <SelectTrigger id="groupId">
                <SelectValue placeholder="Guruh tanlang" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((grp) => (
                  <SelectItem key={grp.id} value={grp.id}>
                    {grp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="subjectId">Fan *</Label>
          <Select
            value={formData.subjectId}
            onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
            required
          >
            <SelectTrigger id="subjectId">
              <SelectValue placeholder="Fan tanlang" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="teacherId">O'qituvchi *</Label>
          <Select
            value={formData.teacherId}
            onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
            required
          >
            <SelectTrigger id="teacherId">
              <SelectValue placeholder="O'qituvchi tanlang" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dayOfWeek">Hafta kuni *</Label>
          <Select
            value={formData.dayOfWeek}
            onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
            required
          >
            <SelectTrigger id="dayOfWeek">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startTime">Boshlanish vaqti *</Label>
          <Select
            value={formData.startTime}
            onValueChange={(value) => setFormData({ ...formData, startTime: value })}
            required
          >
            <SelectTrigger id="startTime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="endTime">Tugash vaqti *</Label>
          <Select
            value={formData.endTime}
            onValueChange={(value) => setFormData({ ...formData, endTime: value })}
            required
          >
            <SelectTrigger id="endTime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="roomNumber">Xona raqami (ixtiyoriy)</Label>
          <Input
            id="roomNumber"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            placeholder="Masalan: 101"
          />
        </div>

        <div>
          <Label htmlFor="academicYear">O'quv yili</Label>
          <Input
            id="academicYear"
            value={formData.academicYear}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/admin/schedules">
          <Button type="button" variant="outline">
            Bekor qilish
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            'Saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}

