'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateGroup } from '@/app/actions/group'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditGroupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    groupTeacherId: '',
    roomNumber: '',
    maxStudents: 20,
  })

  useEffect(() => {
    // Load group and teachers data
    Promise.all([
      fetch(`/api/admin/groups/${params.id}`).then(res => res.json()),
      fetch('/api/admin/teachers', {
        cache: 'no-store',
        credentials: 'include'
      }).then(res => res.json())
    ]).then(([groupData, teachersData]) => {
      if (groupData.group) {
        setFormData({
          name: groupData.group.name,
          description: groupData.group.description || '',
          code: groupData.group.code || '',
          groupTeacherId: groupData.group.groupTeacherId || '',
          roomNumber: groupData.group.roomNumber || '',
          maxStudents: groupData.group.maxStudents,
        })
      }
      
      setTeachers(teachersData.teachers || [])
      setDataLoading(false)
    }).catch((error) => {
      console.error('Error loading data:', error)
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
      const result = await updateGroup(params.id, formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Guruh ma\'lumotlari yangilandi',
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

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
          <h1 className="text-2xl md:text-3xl font-bold">Guruhni Tahrirlash</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Guruh ma'lumotlarini o'zgartiring
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
                <Label htmlFor="groupTeacherId">Guruh Rahbari (ixtiyoriy)</Label>
                <Select
                  value={formData.groupTeacherId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    groupTeacherId: value === 'none' ? '' : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Guruh rahbarini tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Hozircha tayinlanmasin</SelectItem>
                    {teachers.length === 0 ? (
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
            Saqlash
          </Button>
        </div>
      </form>
    </div>
  )
}

