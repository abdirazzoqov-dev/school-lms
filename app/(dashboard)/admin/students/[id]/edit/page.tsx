'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateStudent } from '@/app/actions/student'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    classId: '',
    address: '',
  })

  useEffect(() => {
    // Load student and classes data
    Promise.all([
      fetch(`/api/students/${params.id}`).then(res => res.json()),
      fetch('/api/classes').then(res => res.json())
    ]).then(([studentData, classesData]) => {
      if (studentData.student) {
        setFormData({
          fullName: studentData.student.user?.fullName || '',
          studentCode: studentData.student.studentCode,
          dateOfBirth: studentData.student.dateOfBirth 
            ? new Date(studentData.student.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: studentData.student.gender,
          classId: studentData.student.classId || '',
          address: studentData.student.address || '',
        })
      }
      setClasses(classesData.classes || [])
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
      const result = await updateStudent(params.id, formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'O\'quvchi ma\'lumotlari yangilandi',
        })
        router.push('/admin/students')
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
        <Link href="/admin/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">O'quvchini Tahrirlash</h2>
          <p className="text-muted-foreground">O'quvchi ma'lumotlarini yangilang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            O'quvchi Ma'lumotlari
          </CardTitle>
          <CardDescription>
            O'quvchi haqida asosiy ma'lumotlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentCode">O'quvchi Kodi *</Label>
                <Input
                  id="studentCode"
                  placeholder="STD240001"
                  value={formData.studentCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentCode: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tug'ilgan Sana *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Jinsi *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'MALE' | 'FEMALE') =>
                    setFormData(prev => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">O'g'il bola</SelectItem>
                    <SelectItem value="FEMALE">Qiz bola</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Sinf</Label>
                <Select
                  value={formData.classId || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Biriktirilmagan</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls._count?.students || 0} o'quvchi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Textarea
                id="address"
                placeholder="Uy manzili"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/students">
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

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Ota-ona ma'lumotlarini tahrirlash uchun alohida sahifadan foydalaning
          </p>
          <p>
            • O'quvchi kodini o'zgartirganda unique ekanligiga ishonch hosil qiling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

