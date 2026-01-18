'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createGroup } from '@/app/actions/group'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Users, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function CreateGroupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<any[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    groupTeacherId: '',
    roomNumber: '',
    maxStudents: 20,
  })

  const loadTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true)
      const res = await fetch('/api/admin/teachers', { 
        cache: 'no-store',
        credentials: 'include'
      })
      
      if (!res.ok) {
        setTeachers([])
        return
      }
      
      const data = await res.json()
      if (data.teachers && Array.isArray(data.teachers)) {
        setTeachers(data.teachers)
      }
    } catch (error) {
      console.error('Error loading teachers:', error)
      setTeachers([])
    } finally {
      setLoadingTeachers(false)
    }
  }, [])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createGroup(formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Guruh muvaffaqiyatli yaratildi',
        })
        router.push('/admin/groups')
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Yangi Guruh Yaratish</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            O'quvchilar uchun yangi guruh yarating
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guruh Ma'lumotlari
            </CardTitle>
            <CardDescription>
              Guruh haqida asosiy ma'lumotlar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Guruh Nomi *</Label>
                <Input
                  id="name"
                  placeholder="Masalan: Ingliz tili A2+"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Guruh nomini aniq va tushunarli kiriting
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
                <Textarea
                  id="description"
                  placeholder="Guruh haqida qisqacha ma'lumot..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Guruh Kodi (ixtiyoriy)</Label>
                <Input
                  id="code"
                  placeholder="Masalan: ENG-A2"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
                <p className="text-xs text-muted-foreground">
                  Guruh uchun qisqa kod (masalan: ENG-A2, MATH-01)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maksimal O'quvchilar Soni *</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="5"
                  max="50"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupTeacherId">
                  Guruh Rahbari (ixtiyoriy)
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadTeachers}
                    disabled={loadingTeachers}
                    className="ml-2"
                  >
                    {loadingTeachers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </Label>
                <Select
                  value={formData.groupTeacherId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    groupTeacherId: value === 'none' ? '' : value 
                  }))}
                  disabled={loadingTeachers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Guruh rahbarini tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Hozircha tayinlanmasin</SelectItem>
                    {teachers.length === 0 && !loadingTeachers ? (
                      <SelectItem value="none" disabled>
                        O'qituvchilar topilmadi
                      </SelectItem>
                    ) : (
                      teachers.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.user?.fullName || 'No name'} {t.specialization && `(${t.specialization})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Xona Raqami (ixtiyoriy)</Label>
                <Input
                  id="roomNumber"
                  placeholder="Masalan: 201"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/admin/groups">
            <Button type="button" variant="outline">
              Bekor qilish
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guruh Yaratish
          </Button>
        </div>
      </form>
    </div>
  )
}

