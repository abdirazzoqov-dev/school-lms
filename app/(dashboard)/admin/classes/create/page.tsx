'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClass } from '@/app/actions/class'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateClassPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<any[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: 1,
    classTeacherId: '',
    roomNumber: '',
    maxStudents: 30,
  })

  const loadTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true)
      const res = await fetch('/api/admin/teachers', { 
        cache: 'no-store',
        credentials: 'include'
      })
      
      if (!res.ok) {
        console.error('Failed to fetch teachers:', res.status, res.statusText)
        setTeachers([])
        return
      }
      
      const data = await res.json()
      if (data.teachers && Array.isArray(data.teachers)) {
        console.log('Loaded teachers:', data.teachers.length, data.teachers)
        setTeachers(data.teachers)
      } else {
        console.error('Invalid teachers data format:', data)
        setTeachers([])
      }
    } catch (error) {
      console.error('Error loading teachers:', error)
      setTeachers([])
    } finally {
      setLoadingTeachers(false)
    }
  }, [])

  useEffect(() => {
    // Load teachers on mount
    loadTeachers()

    // Reload teachers when window gains focus (user might have created a teacher in another tab)
    const handleFocus = () => {
      loadTeachers()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadTeachers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createClass(formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Sinf muvaffaqiyatli yaratildi',
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

  const handleGradeLevelChange = (gradeLevel: number) => {
    setFormData(prev => ({
      ...prev,
      gradeLevel,
      name: `${gradeLevel}-A` // Auto-suggest name
    }))
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
          <h2 className="text-3xl font-bold tracking-tight">Yangi Sinf</h2>
          <p className="text-muted-foreground">Yangi sinf yarating</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Sinf Darajasi *</Label>
                <Select
                  value={formData.gradeLevel.toString()}
                  onValueChange={(value) => handleGradeLevelChange(parseInt(value))}
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
                <p className="text-xs text-muted-foreground">
                  Format: [sinf darajasi]-[harf] (masalan: 7-A, 8-B)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="classTeacherId">Sinf Rahbari</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadTeachers}
                    disabled={loadingTeachers}
                    className="h-7 text-xs"
                  >
                    {loadingTeachers ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      '↻ Yangilash'
                    )}
                  </Button>
                </div>
                <Select
                  value={formData.classTeacherId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classTeacherId: value }))}
                >
                  <SelectTrigger disabled={loadingTeachers}>
                    <SelectValue placeholder="Sinf rahbarini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.length === 0 && !loadingTeachers ? (
                      <SelectItem value="none" disabled>
                        O'qituvchilar topilmadi
                      </SelectItem>
                    ) : (
                      teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user?.fullName || 'No name'} {teacher.specialization && `(${teacher.specialization})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {teachers.length === 0 && !loadingTeachers && (
                  <p className="text-xs text-muted-foreground">
                    O'qituvchilar ro'yxati bo'sh. Avval o'qituvchi yarating.
                  </p>
                )}
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
          </CardContent>
        </Card>

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

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Sinf nomi har bir o'quv yili uchun unique bo'lishi kerak
          </p>
          <p>
            • Sinf rahbari keyinroq ham tayinlanishi mumkin
          </p>
          <p>
            • Maksimal o'quvchilar soni 10 dan 50 gacha
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

