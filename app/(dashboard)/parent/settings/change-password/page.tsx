'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export default function ParentChangePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const passwordChecks = {
    length: formData.newPassword.length >= 8,
    match: formData.newPassword.length > 0 && formData.newPassword === formData.confirmPassword,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: 'Xato!', description: 'Yangi parollar mos kelmayapti', variant: 'destructive' })
      return
    }

    if (formData.newPassword.length < 8) {
      toast({ title: 'Xato!', description: 'Parol kamida 8 belgidan iborat bo\'lishi kerak', variant: 'destructive' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: 'Muvaffaqiyatli!', description: 'Parol muvaffaqiyatli o\'zgartirildi' })
        router.push('/parent/settings')
        router.refresh()
      } else {
        toast({ title: 'Xato!', description: data.error || 'Parolni o\'zgartirishda xatolik', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Xato!', description: 'Serverda xatolik yuz berdi', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/parent/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Parolni O'zgartirish</h1>
            <p className="text-sm text-muted-foreground">Hisobingiz xavfsizligi uchun parolni yangilang</p>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              Yangi Parol
            </CardTitle>
            <CardDescription>
              Parol kamida 8 belgidan iborat bo'lishi kerak
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Joriy parol</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yangi parol</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Checks */}
              {formData.newPassword.length > 0 && (
                <div className="space-y-1.5 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordChecks.length ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    Kamida 8 ta belgi
                  </div>
                  {formData.confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-2 ${passwordChecks.match ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordChecks.match ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      Parollar mos keladi
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || !passwordChecks.length}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Saqlanmoqda...' : 'Parolni O\'zgartirish'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/parent/settings')}
                  disabled={isLoading}
                >
                  Bekor qilish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
