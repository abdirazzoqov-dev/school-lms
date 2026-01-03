'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, School, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'

export default function SchoolSettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo: null as File | null,
  })

  useEffect(() => {
    fetchSchoolDetails()
  }, [])

  const fetchSchoolDetails = async () => {
    try {
      const response = await fetch('/api/tenant/settings')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          logo: null,
        })
        if (data.logo) {
          setLogoPreview(data.logo)
        }
      }
    } catch (error) {
      console.error('Error fetching school details:', error)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Fayl hajmi 2MB dan kichik bo\'lishi kerak')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Faqat rasm fayllarini yuklash mumkin')
        return
      }

      setFormData({ ...formData, logo: file })
      
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('address', formData.address || '')
      submitData.append('phone', formData.phone || '')
      submitData.append('email', formData.email || '')
      if (formData.logo) {
        submitData.append('logo', formData.logo)
      }

      const response = await fetch('/api/tenant/settings', {
        method: 'PUT',
        body: submitData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Maktab ma\'lumotlari yangilandi')
        router.push('/admin/settings')
        router.refresh()
      } else {
        toast.error(data.error || 'Ma\'lumotlarni yangilashda xatolik')
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
          <h1 className="text-3xl font-bold">Maktab Sozlamalari</h1>
          <p className="text-muted-foreground">
            Maktab ma'lumotlari va logosini boshqaring
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Maktab Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Bu ma'lumotlar tizimda va hisobotlarda ko'rsatiladi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Maktab Logosi</Label>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative h-24 w-24 rounded-lg border-2 border-dashed overflow-hidden">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-slate-50">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG yoki WebP. Maksimal hajm: 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Maktab nomi *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Maktab nomi"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Textarea
                id="address"
                placeholder="Maktab manzili"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+998 71 123 45 67"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@maktab.uz"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
    </div>
  )
}

