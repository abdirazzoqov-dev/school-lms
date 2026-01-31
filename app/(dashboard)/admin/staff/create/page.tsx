'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createStaff } from '@/app/actions/staff'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2, Key, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default function CreateStaffPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
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

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: result.message,
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
          <p className="text-muted-foreground">Yangi xodim qo'shing</p>
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
              Xodim haqida asosiy ma'lumotlar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Input
                id="monthlySalary"
                type="number"
                min="0"
                placeholder="3000000"
                value={formData.monthlySalary || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlySalary: parseFloat(e.target.value) || 0 }))}
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
                Xodimga login va parolni xavfsiz tarzda yetkazib bering
              </p>
            </div>
          </CardContent>
        </Card>

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
          <p>
            • Xodim email orqali tizimga kiradi
          </p>
          <p>
            • Parolni xodimga xavfsiz kanal orqali yetkazib bering
          </p>
          <p>
            • Xodim kodi har bir maktabda unique bo'lishi kerak
          </p>
          <p>
            • Oylik maoshni kiritmasangiz, keyinroq qo'shishingiz mumkin
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
