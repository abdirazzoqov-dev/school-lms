'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createContactPerson } from '@/app/actions/contact'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function ContactForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    phone: '',
    email: '',
    description: '',
    displayOrder: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.position || !formData.phone) {
      toast.error('Barcha majburiy maydonlarni to\'ldiring')
      return
    }

    setIsSubmitting(true)
    try {
      await createContactPerson(formData)
      toast.success('Ma\'sul xodim qo\'shildi')
      router.push('/admin/contacts')
      router.refresh()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">
            F.I.O <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Aliyev Vali Muhammadovich"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">
            Lavozim <span className="text-destructive">*</span>
          </Label>
          <Input
            id="position"
            placeholder="Direktor, Zamdirektor, ..."
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Telefon raqam <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+998901234567"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="direktor@school.uz"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayOrder">Tartib raqami</Label>
        <Input
          id="displayOrder"
          type="number"
          placeholder="0"
          value={formData.displayOrder}
          onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
        />
        <p className="text-xs text-muted-foreground">
          Kichik raqam birinchi ko'rinadi
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Qo'shimcha ma'lumot</Label>
        <Textarea
          id="description"
          placeholder="Ish vaqti, qabul kunlari va boshqa ma'lumotlar..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </div>
    </form>
  )
}
