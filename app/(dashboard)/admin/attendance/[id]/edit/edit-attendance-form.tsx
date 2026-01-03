'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, UserCheck, UserX, Clock, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Attendance {
  id: string
  status: string
  notes: string | null
  date: Date
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
  }
}

interface EditAttendanceFormProps {
  attendance: Attendance
}

export function EditAttendanceForm({ attendance }: EditAttendanceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>(
    attendance.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  )
  const [notes, setNotes] = useState(attendance.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/attendance/${attendance.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Xatolik yuz berdi')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Davomat yangilandi',
      })

      router.push(`/admin/attendance/${attendance.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle>Ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">O'quvchi</p>
              <p className="font-semibold">{attendance.student.user?.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sinf</p>
              <Badge variant="outline">{attendance.class.name}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fan</p>
              <p className="font-semibold">{attendance.subject.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sana</p>
              <p className="text-sm">
                {new Date(attendance.date).toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Davomatni Tahrirlash</CardTitle>
          <CardDescription>
            Holat va izohni o'zgartiring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Selection */}
          <div className="space-y-3">
            <Label>Holat *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                type="button"
                variant={status === 'PRESENT' ? 'default' : 'outline'}
                onClick={() => setStatus('PRESENT')}
                className={`h-20 ${status === 'PRESENT' ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <UserCheck className="h-6 w-6" />
                  <span>Kelgan</span>
                </div>
              </Button>

              <Button
                type="button"
                variant={status === 'ABSENT' ? 'default' : 'outline'}
                onClick={() => setStatus('ABSENT')}
                className={`h-20 ${status === 'ABSENT' ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <UserX className="h-6 w-6" />
                  <span>Kelmagan</span>
                </div>
              </Button>

              <Button
                type="button"
                variant={status === 'LATE' ? 'default' : 'outline'}
                onClick={() => setStatus('LATE')}
                className={`h-20 ${status === 'LATE' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Clock className="h-6 w-6" />
                  <span>Kech keldi</span>
                </div>
              </Button>

              <Button
                type="button"
                variant={status === 'EXCUSED' ? 'default' : 'outline'}
                onClick={() => setStatus('EXCUSED')}
                className={`h-20 ${status === 'EXCUSED' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Sababli</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Qo'shimcha ma'lumot..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Bekor qilish
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          Saqlash
        </Button>
      </div>
    </div>
  )
}

