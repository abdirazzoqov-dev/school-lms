'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { sendMessage, replyToMessage as replyAction } from '@/app/actions/message'
import { 
  Loader2, 
  ArrowLeft, 
  Send, 
  UserCircle, 
  BookOpen, 
  Users,
  MessageSquare,
  Info,
  Star,
  CheckCircle2
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  subjects: string[]
  students: Array<{ id: string; name: string; className: string }>
}

interface Student {
  id: string
  name: string
  className: string
}

interface ComposeMessageFormProps {
  teachers: Teacher[]
  students: Student[]
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
    studentId: replyToMessage?.student?.id || '',
  })

  const selectedTeacher = teachers.find(t => t.id === formData.recipientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result

      if (replyToMessage) {
        result = await replyAction(replyToMessage.id, {
          content: formData.content
        })
      } else {
        result = await sendMessage({
          recipientId: formData.recipientId,
          studentId: formData.studentId || undefined,
          subject: formData.subject,
          content: formData.content,
        })
      }

      if (result.success) {
        toast.success('Xabar muvaffaqiyatli yuborildi', {
          description: 'Xabar o\'qituvchiga yetkazildi'
        })
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/parent/messages">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {replyToMessage ? 'Javob Yozish' : 'Yangi Xabar'}
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            O'qituvchiga xabar yuboring
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reply Info */}
        {replyToMessage && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <MessageSquare className="h-5 w-5" />
                Javob berilayotgan xabar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Dan:</span>
                <span className="text-sm">{replyToMessage.sender.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mavzu:</span>
                <span className="text-sm">{replyToMessage.subject}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teacher Selection */}
        {!replyToMessage && (
          <>
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  O'qituvchini tanlang
                </CardTitle>
                <CardDescription>
                  Farzandingizga dars beruvchi o'qituvchilar ro'yxati
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipientId" className="text-base font-semibold mb-3 block">
                      Qabul qiluvchi (O'qituvchi) *
                    </Label>
                    <Select
                      value={formData.recipientId}
                      onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
                      required
                    >
                      <SelectTrigger id="recipientId" className="h-12 text-base">
                        <SelectValue placeholder="O'qituvchini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            O'qituvchilar topilmadi
                          </SelectItem>
                        ) : (
                          teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id} className="py-3">
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                <span className="font-semibold">{teacher.name}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                  {teacher.subjects.join(', ')}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Selected Teacher Info */}
                    {selectedTeacher && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-900 rounded-xl">
                        <div className="flex items-start gap-3 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-bold text-green-900 dark:text-green-100 mb-1">
                              {selectedTeacher.name}
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {selectedTeacher.subjects.map((subject, index) => (
                                <Badge key={index} className="bg-green-600 hover:bg-green-700">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                <Users className="h-3 w-3 inline mr-1" />
                                Qaysi farzandlaringizga dars beradi:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedTeacher.students.map((student) => (
                                  <Badge key={student.id} variant="outline" className="border-green-300 text-green-700 dark:text-green-300">
                                    {student.name} ({student.className})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student Selection (Optional) */}
                  <div>
                    <Label htmlFor="studentId" className="text-base font-semibold mb-3 block">
                      Farzandingiz (ixtiyoriy)
                    </Label>
                    <Select
                      value={formData.studentId || "none"}
                      onValueChange={(value) => setFormData({ ...formData, studentId: value === "none" ? "" : value })}
                    >
                      <SelectTrigger id="studentId" className="h-12 text-base">
                        <SelectValue placeholder="Tanlanmagan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanlanmagan</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id} className="py-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span className="font-semibold">{student.name}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{student.className}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Agar xabar ma'lum bir farzandingiz haqida bo'lsa, uni tanlang</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject */}
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Mavzu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Label htmlFor="subject" className="text-base font-semibold mb-3 block">
                  Xabar mavzusi *
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Masalan: Savol bor edi"
                  className="h-12 text-base"
                  required
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Message Content */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Xabar matni
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Label htmlFor="content" className="text-base font-semibold mb-3 block">
              Xabaringizni yozing *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Xabar matnini kiriting..."
              rows={10}
              className="text-base resize-none"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              Xabaringizni to'liq va aniq yozing
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex justify-end gap-3">
              <Link href="/parent/messages">
                <Button type="button" variant="outline" size="lg" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Bekor qilish
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.recipientId || !formData.subject || !formData.content}
                size="lg"
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Xabar Yuborish
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
