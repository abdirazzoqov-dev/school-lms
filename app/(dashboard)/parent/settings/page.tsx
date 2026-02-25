'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, Lock, Bell, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { changeOwnPassword } from '@/app/actions/user'
import { useSession } from 'next-auth/react'

export default function ParentSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.newPass !== form.confirm) {
      toast({ title: 'Xato!', description: 'Yangi parollar mos kelmayapti', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const result = await changeOwnPassword(form.current, form.newPass)
      if (result.success) {
        toast({ title: 'Muvaffaqiyatli!', description: 'Parol muvaffaqiyatli o\'zgartirildi' })
        setDialogOpen(false)
        setForm({ current: '', newPass: '', confirm: '' })
      } else {
        toast({ title: 'Xato!', description: result.error, variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Settings className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Sozlamalar</h1>
                <p className="text-purple-50 text-lg">Hisob va bildirishnomalar sozlamalari</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        </div>

        {/* Account Settings */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Hisob Sozlamalari
            </CardTitle>
            <CardDescription>Shaxsiy ma'lumotlarni tahrirlash</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold">Profil ma'lumotlarini tahrirlash</p>
                <p className="text-sm text-gray-500">Ism, telefon va boshqa ma'lumotlar</p>
              </div>
              <Button variant="outline" disabled>
                <User className="mr-2 h-4 w-4" />
                Tahrirlash
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold">Email manzil</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
              <Button variant="outline" disabled>
                O'zgartirish
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              Xavfsizlik
            </CardTitle>
            <CardDescription>Parol va kirish sozlamalari</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold">Parolni o'zgartirish</p>
                <p className="text-sm text-gray-500">Yangi parol o'rnatish</p>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lock className="mr-2 h-4 w-4" />
                    O'zgartirish
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Parolni o'zgartirish</DialogTitle>
                    <DialogDescription>
                      Joriy parolingizni kiriting va yangi parol o'rnating
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current password */}
                    <div className="space-y-2">
                      <Label htmlFor="current">Joriy parol</Label>
                      <div className="relative">
                        <Input
                          id="current"
                          type={showCurrent ? 'text' : 'password'}
                          placeholder="Joriy parolingiz"
                          value={form.current}
                          onChange={(e) => setForm(prev => ({ ...prev, current: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowCurrent(v => !v)}
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPass">Yangi parol</Label>
                      <div className="relative">
                        <Input
                          id="newPass"
                          type={showNew ? 'text' : 'password'}
                          placeholder="Kamida 6 belgi"
                          value={form.newPass}
                          onChange={(e) => setForm(prev => ({ ...prev, newPass: e.target.value }))}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNew(v => !v)}
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Yangi parolni tasdiqlang</Label>
                      <div className="relative">
                        <Input
                          id="confirm"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Parolni qayta kiriting"
                          value={form.confirm}
                          onChange={(e) => setForm(prev => ({ ...prev, confirm: e.target.value }))}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirm(v => !v)}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {form.confirm && form.newPass !== form.confirm && (
                        <p className="text-xs text-red-500">Parollar mos kelmayapti</p>
                      )}
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                        Bekor qilish
                      </Button>
                      <Button type="submit" disabled={loading || (!!form.confirm && form.newPass !== form.confirm)}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                        Saqlash
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Oxirgi kirish</p>
                <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              Bildirishnomalar
            </CardTitle>
            <CardDescription>Email va push bildirishnomalar</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Email bildirishnomalar</p>
                <p className="text-sm text-gray-500">Baholar, davomat va xabarlar</p>
              </div>
              <Button variant="outline" disabled>Faol</Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">To'lov eslatmalari</p>
                <p className="text-sm text-gray-500">To'lov muddati yaqinlashganda</p>
              </div>
              <Button variant="outline" disabled>Faol</Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Davomat bildirishnomasi</p>
                <p className="text-sm text-gray-500">Farzand maktabga kelmasa</p>
              </div>
              <Button variant="outline" disabled>Faol</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
