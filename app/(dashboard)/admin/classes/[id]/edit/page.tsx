'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateClass } from '@/app/actions/class'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: 1,
    classTeacherId: '',
    roomNumber: '',
    maxStudents: 30,
  })

  useEffect(() => {
    // Load class and teachers data
    Promise.all([
      fetch(`/api/classes/${params.id}`).then(res => res.json()),
      fetch('/api/teachers').then(res => res.json())
    ]).then(([classData, teachersData]) => {
      if (classData.class) {
        setFormData({
          name: classData.class.name,
          gradeLevel: classData.class.gradeLevel,
          classTeacherId: classData.class.classTeacherId || '',
          roomNumber: classData.class.roomNumber || '',
          maxStudents: classData.class.maxStudents,
        })
      }
      setTeachers(teachersData.teachers || [])
      setDataLoading(false)
    }).catch(() => {
      toast({
        title: 'Xato!',
        description: 'Ma\'lumotlarni yuklashda xatolik',
        variant: 'destructive',
      })
      setDataLoading(false)
    })
  }, [params.id, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateClass(params.id, formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Sinf ma\'lumotlari yangilandi',
        })
        router.push('/admin/classes')
      } else {
        toast({
          title: 'Xato!',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/classes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sinfni Tahrirlash</h2>
          <p className="text-muted-foreground">Sinf ma'lumotlarini yangilang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Sinf Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Sinf haqida asosiy ma'lumotlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Sinf Darajasi *</Label>
                <Select
                  value={formData.gradeLevel.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gradeLevel: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>
                        {grade}-sinf
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Sinf Nomi *</Label>
                <Input
                  id="name"
                  placeholder="Masalan: 7-A"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classTeacherId">Sinf Rahbari</Label>
                <Select
                  value={formData.classTeacherId || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classTeacherId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sinf rahbarini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Biriktirilmagan</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.user?.fullName || 'No name'} ({teacher.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Xona Raqami</Label>
                <Input
                  id="roomNumber"
                  placeholder="Masalan: 201"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maksimal O'quvchilar Soni *</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="10"
                  max="50"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/classes">
                <Button type="button" variant="outline">
                  Bekor qilish
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Saqlash
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

