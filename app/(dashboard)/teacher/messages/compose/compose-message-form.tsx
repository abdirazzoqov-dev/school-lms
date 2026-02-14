'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { sendMessage, replyToMessage as replyToMessageAction } from '@/app/actions/message'
import { Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ComposeMessageFormProps {
  parents: Array<{ 
    id: string
    name: string
    students: Array<{ 
      id: string
      name: string
      className: string 
    }> 
  }>
  students: Array<{ 
    id: string
    name: string
    className: string 
  }>
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
  const [openParent, setOpenParent] = useState(false)
  
  const [formData, setFormData] = useState({
    recipientId: preselectedParentId || (replyToMessage?.sender.id || ''),
    subject: replyToMessage ? `Re: ${replyToMessage.subject}` : '',
    content: '',
    studentId: preselectedStudentId || (replyToMessage?.student?.id || ''),
  })

  // Filter students based on selected parent
  const [availableStudents, setAvailableStudents] = useState(students)

  useEffect(() => {
    if (formData.recipientId) {
      const parent = parents.find(p => p.id === formData.recipientId)
      if (parent && parent.students.length > 0) {
        setAvailableStudents(parent.students)
        // Auto-select student if only one
        if (parent.students.length === 1 && !formData.studentId) {
          setFormData(prev => ({ ...prev, studentId: parent.students[0].id }))
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
        result = await replyToMessageAction(replyToMessage.id, {
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
            <Popover open={openParent} onOpenChange={setOpenParent}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openParent}
                  className="w-full justify-between"
                >
                  {formData.recipientId
                    ? (() => {
                        const parent = parents.find(p => p.id === formData.recipientId)
                        return parent 
                          ? `${parent.name} (${parent.students.map(s => `${s.name} - ${s.className}`).join(', ')})`
                          : "Ota-onani tanlang"
                      })()
                    : "Ota-onani tanlang"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Ota-ona yoki o'quvchi nomini kiriting..." />
                  <CommandList>
                    <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>
                    <CommandGroup>
                      {parents.map((parent) => (
                        <CommandItem
                          key={parent.id}
                          value={`${parent.name} ${parent.students.map(s => `${s.name} ${s.className}`).join(' ')}`}
                          onSelect={() => {
                            setFormData({ ...formData, recipientId: parent.id })
                            setOpenParent(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.recipientId === parent.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{parent.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {parent.students.map(s => `${s.name} (${s.className})`).join(', ')}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {formData.recipientId && (
              <p className="text-xs text-muted-foreground mt-1">
                Agar xabar ma'lum o'quvchi haqida bo'lsa, quyida o'quvchini tanlang
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="studentId">O'quvchi (ixtiyoriy)</Label>
            <Select
              value={formData.studentId || "none"}
              onValueChange={(value) => setFormData({ ...formData, studentId: value === "none" ? "" : value })}
            >
              <SelectTrigger id="studentId">
                <SelectValue placeholder="O'quvchini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.className})
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

