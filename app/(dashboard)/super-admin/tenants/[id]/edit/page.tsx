'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateTenant } from '@/app/actions/tenant'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditTenantPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'BASIC' as 'BASIC' | 'STANDARD' | 'PREMIUM',
  })

  useEffect(() => {
    // Load tenant data
    fetch(`/api/tenants/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.tenant) {
          setFormData({
            name: data.tenant.name,
            slug: data.tenant.slug,
            email: data.tenant.email || '',
            phone: data.tenant.phone || '',
            address: data.tenant.address || '',
            subscriptionPlan: data.tenant.subscriptionPlan,
          })
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
      const result = await updateTenant(params.id, formData)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Maktab ma\'lumotlari yangilandi',
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
        <Link href="/super-admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maktabni Tahrirlash</h2>
          <p className="text-muted-foreground">Maktab ma'lumotlarini yangilang</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Maktab Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Maktab haqida asosiy ma'lumotlarni tahrirlang
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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

            <div className="flex justify-end gap-4">
              <Link href="/super-admin/tenants">
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

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-sm">⚠️ Diqqat</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Slug o'zgartirilsa, admin login ham o'zgaradi (admin@[slug].uz)
          </p>
          <p>
            • Subscription plan o'zgarsa, limitlar ham yangilanadi
          </p>
          <p>
            • Mavjud o'quvchi/o'qituvchilar soni yangi limitdan ko'p bo'lmasligi kerak
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

