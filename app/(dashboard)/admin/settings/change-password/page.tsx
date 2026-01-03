'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Yangi parollar mos kelmayapti')
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error('Parol kamida 8 belgidan iborat bo\'lishi kerak')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Parol muvaffaqiyatli o\'zgartirildi')
        router.push('/admin/settings')
        router.refresh()
      } else {
        toast.error(data.error || 'Parolni o\'zgartirishda xatolik')
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
          <h1 className="text-3xl font-bold">Parolni O'zgartirish</h1>
          <p className="text-muted-foreground">
            Hisobingiz xavfsizligi uchun parolni yangilang
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Yangi Parol
          </CardTitle>
          <CardDescription>
            Parol kamida 8 belgidan iborat bo'lishi va harflar, raqamlar va maxsus belgilarni o'z ichiga olishi kerak
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Joriy parol</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yangi parol</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saqlanmoqda...' : 'Parolni O\'zgartirish'}
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

      {/* Password Requirements */}
      <Card className="max-w-2xl border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Parol talablari:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Kamida 8 belgidan iborat bo'lishi</li>
            <li>Katta va kichik harflarni o'z ichiga olishi tavsiya etiladi</li>
            <li>Raqamlarni o'z ichiga olishi tavsiya etiladi</li>
            <li>Maxsus belgilarni (@, #, $, va h.k.) ishlatish tavsiya etiladi</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

