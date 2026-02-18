'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createTeacher } from '@/app/actions/teacher'
import { uploadAvatar } from '@/app/actions/upload-avatar'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2, Key } from 'lucide-react'
import Link from 'next/link'
import { ProfilePhotoUpload } from '@/components/profile-photo-upload'

export default function CreateTeacherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [avatarBase64, setAvatarBase64] = useState('')
  const [avatarFileName, setAvatarFileName] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    teacherCode: '',
    specialization: '',
    education: '',
    experienceYears: 0,
    monthlySalary: 0,
    password: '',
  })

  const generateTeacherCode = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-code?type=teacher')
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // If session expired or tenant not found, suggest relogin
        if (errorData.needsRelogin || response.status === 401 || response.status === 404) {
          toast({
            title: 'Session muddati tugagan',
            description: 'Iltimos logout qiling va qaytadan login qiling.',
            variant: 'destructive',
            duration: 5000,
          })
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = '/api/auth/signout?callbackUrl=/login'
          }, 2000)
          return
        }
        
        throw new Error(errorData.error || 'Server xatosi')
      }
      
      const data = await response.json()
      
      if (data.success && data.code) {
        setFormData(prev => ({ ...prev, teacherCode: data.code }))
        toast({
          title: 'Kod yaratildi',
          description: `O'qituvchi kodi: ${data.code}`,
        })
      } else {
        throw new Error(data.error || 'Kod yaratishda xato')
      }
    } catch (error: any) {
      console.error('Generate teacher code error:', error)
      toast({
        title: 'Xato',
        description: error.message || 'Kod generatsiya qilishda xatolik',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Auto-generate teacher code on mount
  useEffect(() => {
    generateTeacherCode()
  }, [generateTeacherCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createTeacher(formData)

      if (result.success) {
        // Upload avatar if selected
        if (avatarBase64 && result.teacher?.userId) {
          await uploadAvatar(result.teacher.userId, avatarBase64, avatarFileName || 'avatar.jpg')
        }
        toast({
          title: 'Muvaffaqiyatli!',
          description: `O'qituvchi qo'shildi. Login: ${result.credentials?.email}`,
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


  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, password }))
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
          <h2 className="text-3xl font-bold tracking-tight">Yangi O'qituvchi</h2>
          <p className="text-muted-foreground">Yangi o'qituvchi qo'shing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex justify-center pt-2 pb-2">
              <ProfilePhotoUpload
                name={formData.fullName}
                size={100}
                gradient="from-purple-500 to-pink-600"
                onAvatarChange={(base64, fileName) => {
                  setAvatarBase64(base64)
                  setAvatarFileName(fileName)
                }}
              />
            </div>
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                <div className="flex gap-2">
                  <Input
                    id="teacherCode"
                    placeholder="TCH24001"
                    value={formData.teacherCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherCode: e.target.value }))}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateTeacherCode}>
                    Generatsiya
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="monthlySalary">Oylik Maosh (so'm) *</Label>
              <Input
                id="monthlySalary"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="5000000"
                value={formData.monthlySalary || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlySalary: parseFloat(e.target.value) || 0 }))}
                required
              />
              {formData.monthlySalary > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.monthlySalary.toLocaleString('uz-UZ')} so'm/oy
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Kirish Ma'lumotlari
            </CardTitle>
            <CardDescription>
              Tizimga kirish uchun parol yarating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Parol *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  placeholder="Kamida 6 ta belgi"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generatsiya
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O'qituvchiga login va parolni xavfsiz tarzda yetkazib bering
              </p>
            </div>
          </CardContent>
        </Card>

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

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • O'qituvchi email orqali tizimga kiradi
          </p>
          <p>
            • Parolni o'qituvchiga xavfsiz kanал orqali yetkazib bering
          </p>
          <p>
            • O'qituvchi kodi har bir maktabda unique bo'lishi kerak
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

