'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { sendMessage, replyToMessage as replyAction } from '@/app/actions/message'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ComposeMessageFormProps {
  teachers: Array<{ id: string; name: string; subjects: string[]; isClassTeacher?: boolean }>
  students: Array<{ id: string; name: string }>
  replyToMessage?: any
}

export function ComposeMessageForm({ 
  teachers, 
  students, 
  replyToMessage 
}: ComposeMessageFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    recipientId: replyToMessage?.sender.id || '',
    subject: replyToMessage ? `Re: ${replyToMessage.subject}` : '',
    content: '',
    studentId: replyToMessage?.student?.id || '', // Which student this message is about
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result

      if (replyToMessage) {
        // Send as reply
        result = await replyAction(replyToMessage.id, {
          content: formData.content
        })
      } else {
        // Send new message with studentId for context
        result = await sendMessage({
          recipientId: formData.recipientId,
          studentId: formData.studentId || undefined,
          subject: formData.subject,
          content: formData.content,
        })
      }

      if (result.success) {
        toast.success('Xabar yuborildi')
        router.push('/parent/messages')
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
            <Label htmlFor="recipientId">Qabul qiluvchi (O'qituvchi) *</Label>
            <Select
              value={formData.recipientId}
              onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
              required
            >
              <SelectTrigger id="recipientId">
                <SelectValue placeholder="O'qituvchini tanlang" />
              </SelectTrigger>
              <SelectContent>
                {teachers
                  .sort((a, b) => {
                    // Sinf rahbarini birinchi qo'yamiz
                    if (a.isClassTeacher && !b.isClassTeacher) return -1
                    if (!a.isClassTeacher && b.isClassTeacher) return 1
                    return 0
                  })
                  .map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.isClassTeacher && '⭐'} ({teacher.subjects.join(', ')})
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="studentId">Farzandingiz (ixtiyoriy)</Label>
            <Select
              value={formData.studentId || "none"}
              onValueChange={(value) => setFormData({ ...formData, studentId: value === "none" ? "" : value })}
            >
              <SelectTrigger id="studentId">
                <SelectValue placeholder="Farzandingizni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Agar xabar ma'lum bir farzandingiz haqida bo'lsa, uni tanlang
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Mavzu *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Masalan: Savol bor edi"
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
        <Link href="/parent/messages">
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

