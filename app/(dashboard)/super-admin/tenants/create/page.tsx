'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTenant } from '@/app/actions/tenant'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateTenantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'BASIC' as 'BASIC' | 'STANDARD' | 'PREMIUM',
    trialDays: 30,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createTenant(formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: `Maktab yaratildi. Admin login: ${result.adminCredentials?.email}`,
        })
        router.push('/super-admin/tenants')
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

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug from name
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yangi Maktab</h2>
          <p className="text-muted-foreground">Yangi maktab qo'shing va sozlang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Maktab Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Maktab haqida asosiy ma'lumotlarni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Maktab Nomi *</Label>
                <Input
                  id="name"
                  placeholder="Masalan: Respublika Maktab"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  placeholder="respublika-maktab"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Faqat kichik harflar, raqamlar va - (masalan: respublika-maktab)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@maktab.uz"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Textarea
                id="address"
                placeholder="Toshkent shahar, ..."
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Obuna Rejasi *</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value: 'BASIC' | 'STANDARD' | 'PREMIUM') =>
                    setFormData(prev => ({ ...prev, subscriptionPlan: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">
                      BASIC (50 o'quvchi, 10 o'qituvchi)
                    </SelectItem>
                    <SelectItem value="STANDARD">
                      STANDARD (200 o'quvchi, 30 o'qituvchi)
                    </SelectItem>
                    <SelectItem value="PREMIUM">
                      PREMIUM (Cheksiz)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDays">Sinov Muddati (kun)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="0"
                  max="90"
                  value={formData.trialDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/super-admin/tenants">
                <Button type="button" variant="outline">
                  Bekor qilish
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yaratish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Maktab yaratilgach, avtomatik ravishda <strong>Admin</strong> foydalanuvchi yaratiladi
          </p>
          <p>
            • Admin login: <code className="bg-white px-2 py-1 rounded">admin@[slug].uz</code>
          </p>
          <p>
            • Default parol: <code className="bg-white px-2 py-1 rounded">Admin123!</code>
          </p>
          <p>
            • Admin birinchi kirishda parolni o'zgartirishi kerak
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

