'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { updateStaff, resetStaffPassword } from '@/app/actions/staff'
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

export default function EditStaffPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    staffCode: '',
    position: '',
    department: '',
    education: '',
    monthlySalary: '',
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => {
    // Load staff data
    fetch(`/api/admin/staff/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.staff) {
          setFormData({
            fullName: data.staff.user.fullName,
            phone: data.staff.user.phone || '',
            staffCode: data.staff.staffCode,
            position: data.staff.position,
            department: data.staff.department || '',
            education: data.staff.education || '',
            monthlySalary: data.staff.monthlySalary ? data.staff.monthlySalary.toString() : '',
          })
          setUserId(data.staff.user.id || '')
          setCurrentAvatar(data.staff.user.avatar || null)
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
        monthlySalary: formData.monthlySalary ? parseFloat(formData.monthlySalary) : undefined,
      }
      const result = await updateStaff(params.id, submitData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Xodim ma\'lumotlari yangilandi',
        })
        router.push('/admin/staff')
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
      const result = await resetStaffPassword(params.id, newPassword)

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
        <Link href="/admin/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Xodimni Tahrirlash</h2>
          <p className="text-muted-foreground">Xodim ma'lumotlarini yangilang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Shaxsiy Ma'lumotlar
          </CardTitle>
          <CardDescription>
            Xodim haqida asosiy ma'lumotlar
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
                gradient="from-cyan-500 to-blue-600"
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
                <Label htmlFor="staffCode">Xodim Kodi *</Label>
                <Input
                  id="staffCode"
                  placeholder="STF24001"
                  value={formData.staffCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffCode: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Lavozim *</Label>
                <Input
                  id="position"
                  placeholder="Masalan: Hisobchi, Xavfsizlik"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Bo'lim</Label>
                <Input
                  id="department"
                  placeholder="Masalan: Ma'muriy, Moliyaviy"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
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
              <Label htmlFor="monthlySalary">Oylik Maosh (so'm)</Label>
              <Input
                id="monthlySalary"
                type="number"
                min="0"
                placeholder="3000000"
                value={formData.monthlySalary}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlySalary: e.target.value }))}
              />
              {formData.monthlySalary && parseFloat(formData.monthlySalary) > 0 && (
                <p className="text-sm text-muted-foreground">
                  {parseFloat(formData.monthlySalary).toLocaleString('uz-UZ')} so'm/oy
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/staff">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Xavfsizlik
          </CardTitle>
          <CardDescription>
            Xodimning parolini o'zgartiring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Parolni O'zgartirish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Parolni O'zgartirish</DialogTitle>
                <DialogDescription>
                  Xodim uchun yangi parol kiriting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yangi Parol</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Kamida 6 ta belgi"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  <Label htmlFor="confirmPassword">Parolni Tasdiqlash</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Parolni qayta kiriting"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
                  disabled={resettingPassword}
                >
                  {resettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  O'zgartirish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Email o'zgartirib bo'lmaydi (xavfsizlik sabablari)
          </p>
          <p>
            • Parolni o'zgartirganingizda yangi parolni xodimga xavfsiz kanal orqali yetkazib bering
          </p>
          <p>
            • Parol kamida 6 belgidan iborat bo'lishi kerak
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
