'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { updateTeacher } from '@/app/actions/teacher'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditTeacherPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    teacherCode: '',
    specialization: '',
    education: '',
    experienceYears: 0,
  })

  useEffect(() => {
    // Load teacher data
    fetch(`/api/teachers/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.teacher) {
          setFormData({
            fullName: data.teacher.user.fullName,
            phone: data.teacher.user.phone || '',
            teacherCode: data.teacher.teacherCode,
            specialization: data.teacher.specialization,
            education: data.teacher.education || '',
            experienceYears: data.teacher.experienceYears || 0,
          })
        }
        setDataLoading(false)
      })
      .catch(() => {
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
      const result = await updateTeacher(params.id, formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'O\'qituvchi ma\'lumotlari yangilandi',
        })
        router.push('/admin/teachers')
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
        <Link href="/admin/teachers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">O'qituvchini Tahrirlash</h2>
          <p className="text-muted-foreground">O'qituvchi ma'lumotlarini yangilang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Shaxsiy Ma'lumotlar
          </CardTitle>
          <CardDescription>
            O'qituvchi haqida asosiy ma'lumotlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">To'liq Ism *</Label>
                <Input
                  id="fullName"
                  placeholder="Masalan: Karimov Oybek Akramovich"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  placeholder="+998 90 123 45 67"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherCode">O'qituvchi Kodi *</Label>
                <Input
                  id="teacherCode"
                  placeholder="TCH24001"
                  value={formData.teacherCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherCode: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specialization">Mutaxassislik *</Label>
                <Input
                  id="specialization"
                  placeholder="Masalan: Matematika"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Ta'lim</Label>
              <Textarea
                id="education"
                placeholder="Oliy ta'lim, diplom..."
                value={formData.education}
                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceYears">Ish Tajribasi (yil)</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/teachers">
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
            • Email va parolni o'zgartirish uchun alohida funksiya kerak (Security)
          </p>
          <p>
            • O'qituvchi kodini o'zgartirganda unique ekanligiga ishonch hosil qiling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

