'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, BookOpen, Trash2, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { addClassSubject, removeClassSubject } from '@/app/actions/class'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ClassSubject {
  id: string
  hoursPerWeek: number
  subject: {
    id: string
    name: string
  }
  teacher: {
    id: string
    user: {
      fullName: string
    }
  }
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Teacher {
  id: string
  specialization: string | null
  user: {
    fullName: string
  }
}

export default function ClassSubjectsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const classId = params.id as string

  const [classItem, setClassItem] = useState<any>(null)
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    hoursPerWeek: 2,
  })

  useEffect(() => {
    loadData()
  }, [classId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [classRes, subjectsRes, teachersRes] = await Promise.all([
        fetch(`/api/admin/classes/${classId}`, {
          cache: 'no-store',
          credentials: 'include',
        }),
        fetch('/api/admin/subjects', {
          cache: 'no-store',
          credentials: 'include',
        }),
        fetch('/api/admin/teachers', {
          cache: 'no-store',
          credentials: 'include',
        }),
      ])

      const classData = await classRes.json()
      const subjectsData = await subjectsRes.json()
      const teachersData = await teachersRes.json()

      setClassItem(classData.class)
      setClassSubjects(classData.class.classSubjects || [])
      setSubjects(subjectsData.subjects || [])
      setTeachers(teachersData.teachers || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Ma\'lumotlarni yuklashda xatolik',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subjectId || !formData.teacherId) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Barcha majburiy maydonlarni to\'ldiring',
      })
      return
    }

    setSubmitting(true)

    const result = await addClassSubject({
      classId,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId,
      hoursPerWeek: formData.hoursPerWeek,
    })

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Fan va o\'qituvchi sinfga biriktirildi',
      })
      setFormData({ subjectId: '', teacherId: '', hoursPerWeek: 2 })
      loadData() // Refresh data
    } else {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: result.error,
      })
    }

    setSubmitting(false)
  }

  const handleRemove = async (id: string) => {
    const result = await removeClassSubject(id)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Fan sinfdan olib tashlandi',
      })
      setDeleteId(null)
      loadData() // Refresh data
    } else {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: result.error,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/admin/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Fanlarni Boshqarish</h1>
          <p className="text-muted-foreground">
            {classItem?.name} • {classItem?.academicYear}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Yangi Fan Qo'shish
            </CardTitle>
            <CardDescription>
              O'qituvchi va fanni sinfga biriktiring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Fan *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, subjectId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fanni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Fanlar topilmadi
                      </SelectItem>
                    ) : (
                      subjects
                        .filter(
                          (s) =>
                            !classSubjects.some((cs) => cs.subject.id === s.id)
                        )
                        .map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher">O'qituvchi *</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, teacherId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="O'qituvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        O'qituvchilar topilmadi
                      </SelectItem>
                    ) : (
                      teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user.fullName}
                          {teacher.specialization &&
                            ` (${teacher.specialization})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoursPerWeek">Haftasiga soat</Label>
                <Input
                  id="hoursPerWeek"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.hoursPerWeek}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hoursPerWeek: parseInt(e.target.value) || 2,
                    }))
                  }
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Qo'shilmoqda...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Qo'shish
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Biriktirilgan Fanlar
            </CardTitle>
            <CardDescription>
              {classSubjects.length} ta fan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classSubjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Hozircha fanlar biriktirilmagan
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {classSubjects.map((cs) => (
                  <div
                    key={cs.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{cs.subject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cs.teacher.user.fullName} • {cs.hoursPerWeek}s/hf
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(cs.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fanni olib tashlash</AlertDialogTitle>
            <AlertDialogDescription>
              Bu fanni sinfdan olib tashlamoqchimisiz? O'qituvchi ushbu sinf va
              fan uchun kirish huquqini yo'qotadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleRemove(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Olib tashlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

