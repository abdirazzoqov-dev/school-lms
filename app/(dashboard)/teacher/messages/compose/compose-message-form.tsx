'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { sendMessage, replyToMessage } from '@/app/actions/message'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ComposeMessageFormProps {
  parents: Array<{ id: string; name: string; students: Array<{ id: string; name: string }> }>
  students: Array<{ id: string; name: string }>
  replyToMessage?: any
  preselectedParentId?: string
  preselectedStudentId?: string
}

export function ComposeMessageForm({ 
  parents, 
  students, 
  replyToMessage,
  preselectedParentId,
  preselectedStudentId
}: ComposeMessageFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    recipientId: preselectedParentId || (replyToMessage?.sender.id || ''),
    subject: replyToMessage ? `Re: ${replyToMessage.subject}` : '',
    content: '',
    relatedStudentId: preselectedStudentId || '',
  })

  // Filter students based on selected parent
  const [availableStudents, setAvailableStudents] = useState(students)

  useEffect(() => {
    if (formData.recipientId) {
      const parent = parents.find(p => p.id === formData.recipientId)
      if (parent && parent.students.length > 0) {
        setAvailableStudents(parent.students)
        // Auto-select student if only one
        if (parent.students.length === 1 && !formData.relatedStudentId) {
          setFormData(prev => ({ ...prev, relatedStudentId: parent.students[0].id }))
        }
      } else {
        setAvailableStudents(students)
      }
    } else {
      setAvailableStudents(students)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.recipientId, parents, students])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result

      if (replyToMessage) {
        // Send as reply
        result = await replyToMessage(replyToMessage.id, {
          content: formData.content
        })
      } else {
        // Send new message
        result = await sendMessage(formData)
      }

      if (result.success) {
        toast.success('Xabar yuborildi')
        router.push('/teacher/messages')
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
      {replyToMessage && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium mb-2">Javob berilayotgan xabar:</p>
          <p className="text-sm text-muted-foreground mb-1">
            <strong>Dan:</strong> {replyToMessage.sender.fullName}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <strong>Mavzu:</strong> {replyToMessage.subject}
          </p>
        </div>
      )}

      {!replyToMessage && (
        <>
          <div>
            <Label htmlFor="recipientId">Qabul qiluvchi (Ota-ona) *</Label>
            <Select
              value={formData.recipientId}
              onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
              required
            >
              <SelectTrigger id="recipientId">
                <SelectValue placeholder="Ota-onani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name} ({parent.students.map(s => s.name).join(', ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="relatedStudentId">O'quvchi (ixtiyoriy)</Label>
            <Select
              value={formData.relatedStudentId || "none"}
              onValueChange={(value) => setFormData({ ...formData, relatedStudentId: value === "none" ? "" : value })}
            >
              <SelectTrigger id="relatedStudentId">
                <SelectValue placeholder="O'quvchini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Agar xabar ma'lum bir o'quvchi haqida bo'lsa, uni tanlang
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Mavzu *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Masalan: O'quvchining o'zlashtirishi haqida"
              required
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="content">Xabar matni *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Xabar matnini kiriting..."
          rows={8}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/teacher/messages">
          <Button type="button" variant="outline">
            Bekor qilish
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yuborilmoqda...
            </>
          ) : (
            'Yuborish'
          )}
        </Button>
      </div>
    </form>
  )
}

