'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createStaff } from '@/app/actions/staff'
import { saveStaffPermissions } from '@/app/actions/staff-permissions'
import { uploadAvatar } from '@/app/actions/upload-avatar'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2, Key, Briefcase } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'
import Link from 'next/link'
import { ProfilePhotoUpload } from '@/components/profile-photo-upload'
import { StaffPermissionMatrix, matrixToPermissionInputs } from '@/components/admin/staff-permission-matrix'
import type { PermissionMatrix } from '@/components/admin/staff-permission-matrix'

export default function CreateStaffPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [avatarBase64, setAvatarBase64] = useState('')
  const [avatarFileName, setAvatarFileName] = useState('')
  const [permissions, setPermissions] = useState<PermissionMatrix>({})
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    staffCode: '',
    position: '',
    department: '',
    education: '',
    monthlySalary: 0,
    password: '',
  })

  const generateStaffCode = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-code?type=staff')
      
      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.needsRelogin || response.status === 401 || response.status === 404) {
          toast({
            title: 'Session muddati tugagan',
            description: 'Iltimos logout qiling va qaytadan login qiling.',
            variant: 'destructive',
            duration: 5000,
          })
          setTimeout(() => {
            window.location.href = '/api/auth/signout?callbackUrl=/login'
          }, 2000)
          return
        }
        
        throw new Error(errorData.error || 'Server xatosi')
      }
      
      const data = await response.json()
      
      if (data.success && data.code) {
        setFormData(prev => ({ ...prev, staffCode: data.code }))
        toast({
          title: 'Kod yaratildi',
          description: `Xodim kodi: ${data.code}`,
        })
      } else {
        throw new Error(data.error || 'Kod yaratishda xato')
      }
    } catch (error: any) {
      console.error('Generate staff code error:', error)
      toast({
        title: 'Xato',
        description: error.message || 'Kod generatsiya qilishda xatolik',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Auto-generate staff code on mount
  useEffect(() => {
    generateStaffCode()
  }, [generateStaffCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createStaff(formData)

      if (result.success && result.userId) {
        // Upload avatar if selected
        if (avatarBase64) {
          await uploadAvatar(result.userId, avatarBase64, avatarFileName || 'avatar.jpg')
        }

        // Save permissions
        const permInputs = matrixToPermissionInputs(permissions)
        if (permInputs.length > 0) {
          await saveStaffPermissions(result.userId, permInputs)
        }

        toast({
          title: "Xodim qo'shildi!",
          description: `Login: ${(result as any).credentials?.email} | Parol: ${(result as any).credentials?.password}`,
          duration: 10000,
        })
        router.push('/admin/staff')
      } else {
        toast({
          title: 'Xato!',
          description: (result as any).error,
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
        <Link href="/admin/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yangi Xodim</h2>
          <p className="text-muted-foreground">Yangi xodim qo'shing va unga ruxsatlar bering</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Personal Info ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Shaxsiy Ma'lumotlar
            </CardTitle>
            <CardDescription>Xodim haqida asosiy ma'lumotlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex justify-center pt-2 pb-2">
              <ProfilePhotoUpload
                name={formData.fullName}
                size={100}
                gradient="from-cyan-500 to-blue-600"
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
                  placeholder="staff@email.com"
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
                <Label htmlFor="staffCode">Xodim Kodi *</Label>
                <div className="flex gap-2">
                  <Input
                    id="staffCode"
                    placeholder="STF24001"
                    value={formData.staffCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffCode: e.target.value }))}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateStaffCode}>
                    Generatsiya
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Lavozim *</Label>
                <Input
                  id="position"
                  placeholder="Masalan: Hisobchi, Xavfsizlik, Xizmatchi"
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
              <CurrencyInput
                id="monthlySalary"
                placeholder="3 000 000"
                value={formData.monthlySalary}
                onChange={(val) => setFormData(prev => ({ ...prev, monthlySalary: val }))}
                currency="so'm"
              />
              {formData.monthlySalary > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.monthlySalary.toLocaleString('uz-UZ')} so'm/oy
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Login Credentials ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Kirish Ma'lumotlari
            </CardTitle>
            <CardDescription>Tizimga kirish uchun parol yarating</CardDescription>
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
                Xodimga login va parolni xavfsiz tarzda yetkazib bering
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Permissions Matrix ─── */}
        <div>
          <div className="mb-3">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              Panel Ruxsatlari
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Xodim tizimga kirganida qaysi sahifalarda qanday amallar bajara olishini belgilang
            </p>
          </div>
          <StaffPermissionMatrix value={permissions} onChange={setPermissions} />
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

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Xodim email orqali tizimga kiradi — admin paneli ochiladi</p>
          <p>• Faqat ruxsat berilgan sahifalar ko'rinadi</p>
          <p>• Ko'rish (READ) ruxsati yo'q sahifaga xodim kira olmaydi</p>
          <p>• Ruxsatlarni keyinroq xodim profilidan o'zgartirishingiz mumkin</p>
        </CardContent>
      </Card>
    </div>
  )
}
