'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProfileEditPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullName: session.user.fullName || '',
        email: session.user.email || '',
        phone: '', // Phone will be fetched from backend
      })
      fetchUserDetails()
    }
  }, [session])

  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          phone: data.phone || '',
        }))
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Profil muvaffaqiyatli yangilandi')
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            fullName: formData.fullName,
            email: formData.email,
          }
        })
        
        router.push('/admin/settings')
        router.refresh()
      } else {
        toast.error(data.error || 'Profilni yangilashda xatolik')
      }
    } catch (error) {
      toast.error('Serverda xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Profilni Tahrirlash</h1>
          <p className="text-muted-foreground">
            Shaxsiy ma'lumotlaringizni yangilang
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Shaxsiy Ma'lumotlar
          </CardTitle>
          <CardDescription>
            Bu ma'lumotlar tizimning barcha qismlarida ko'rsatiladi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ism-familiya *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ism Familiya"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Bu nom tizimda hamma joyda ko'rsatiladi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Email'ni o'zgartirsangiz, keyingi safar yangi email bilan kirish kerak bo'ladi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqami</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Saqlash
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/settings')}
                disabled={isLoading}
              >
                Bekor qilish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="max-w-2xl border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Eslatma:</strong> Email manzilini o'zgartirsangiz, keyingi safar tizimga yangi email bilan kirishingiz kerak bo'ladi. Parolni o'zgartirish uchun "Parolni o'zgartirish" sahifasiga o'ting.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

