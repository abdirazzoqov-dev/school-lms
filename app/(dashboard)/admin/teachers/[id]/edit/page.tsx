'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { updateTeacher, resetTeacherPassword } from '@/app/actions/teacher'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2, Key, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { ProfilePhotoUpload } from '@/components/profile-photo-upload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function EditTeacherPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    teacherCode: '',
    specialization: '',
    education: '',
    experienceYears: 0,
    monthlySalary: 0,
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => {
    // Load teacher data
    fetch(`/api/admin/teachers/${params.id}`)
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
            monthlySalary: data.teacher.monthlySalary ? Number(data.teacher.monthlySalary) : 0,
          })
          setUserId(data.teacher.user.id || '')
          setCurrentAvatar(data.teacher.user.avatar || null)
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
      const submitData = {
        ...formData,
        monthlySalary: formData.monthlySalary > 0 ? formData.monthlySalary : undefined,
      }
      const result = await updateTeacher(params.id, submitData)

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

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Xato!',
        description: 'Parol kamida 6 belgidan iborat bo\'lishi kerak',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Xato!',
        description: 'Parollar mos kelmayapti',
        variant: 'destructive',
      })
      return
    }

    setResettingPassword(true)

    try {
      const result = await resetTeacherPassword(params.id, newPassword)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: result.message || 'Parol muvaffaqiyatli o\'zgartirildi',
        })
        setPasswordDialogOpen(false)
        setNewPassword('')
        setConfirmPassword('')
        router.refresh()
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
      setResettingPassword(false)
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
          {/* Profile photo */}
          {userId && (
            <div className="flex justify-center pt-2 pb-6">
              <ProfilePhotoUpload
                userId={userId}
                currentAvatar={currentAvatar}
                name={formData.fullName}
                size={100}
                gradient="from-purple-500 to-pink-600"
                onUploadSuccess={(url) => setCurrentAvatar(url)}
              />
            </div>
          )}
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

            <div className="space-y-2">
              <Label htmlFor="monthlySalary">💰 Oylik Maosh (so'm)</Label>
              <CurrencyInput
                id="monthlySalary"
                placeholder="5 000 000"
                value={formData.monthlySalary}
                onChange={(val) => setFormData(prev => ({ ...prev, monthlySalary: val }))}
                currency="so'm"
              />
              <p className="text-xs text-muted-foreground">
                O'qituvchining oylik maoshi (so'm)
              </p>
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

      {/* Password Reset Section */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-red-600" />
            Xavfsizlik
          </CardTitle>
          <CardDescription>
            O&apos;qituvchi parolini o&apos;zgartirish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border-2 border-dashed border-red-200">
              <p className="text-sm text-muted-foreground mb-3">
                Agar o&apos;qituvchi parolini unutgan bo&apos;lsa, yangi parol berish mumkin
              </p>
              
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Key className="mr-2 h-4 w-4" />
                    Parolni O&apos;zgartirish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yangi Parol Berish</DialogTitle>
                    <DialogDescription>
                      O&apos;qituvchiga yangi parol belgilang. U shu parol bilan tizimga kiradi.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Yangi Parol *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Kamida 6 belgi"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Parolni Tasdiqlash *</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Parolni qayta kiriting"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-900">
                        ⚠️ <strong>Diqqat:</strong> Yangi parolni o&apos;qituvchiga yodlab qoldiring yoki xavfsiz joyga yozib qo&apos;ying.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPasswordDialogOpen(false)
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      disabled={resettingPassword}
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      onClick={handleResetPassword}
                      disabled={resettingPassword || !newPassword || !confirmPassword}
                    >
                      {resettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Parolni O&apos;zgartirish
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • O&apos;qituvchi kodini o&apos;zgartirganda unique ekanligiga ishonch hosil qiling
          </p>
          <p>
            • Parol kamida 6 belgidan iborat bo&apos;lishi kerak
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

