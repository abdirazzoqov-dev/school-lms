'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createAnnouncement } from '@/app/actions/announcement'
import { Loader2 } from 'lucide-react'
import { PRIORITY_LEVELS, TARGET_AUDIENCES } from '@/lib/validations/announcement'
import Link from 'next/link'

export function AnnouncementForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM' as any,
    targetAudience: 'ALL' as any,
    expiresAt: '',
    isPinned: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createAnnouncement(formData)

      if (result.success) {
        toast.success('E\'lon yaratildi')
        router.push('/admin/announcements')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Sarlavha *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Masalan: Ta'til kunlari o'zgarishi"
          required
        />
      </div>

      <div>
        <Label htmlFor="content">Matn *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="E'lon matnini kiriting..."
          rows={8}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="priority">Muhimlik darajasi *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
            required
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetAudience">Kimga ko'rsatish *</Label>
          <Select
            value={formData.targetAudience}
            onValueChange={(value: any) => setFormData({ ...formData, targetAudience: value })}
            required
          >
            <SelectTrigger id="targetAudience">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_AUDIENCES.map((audience) => (
                <SelectItem key={audience.value} value={audience.value}>
                  {audience.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="expiresAt">Amal qilish muddati (ixtiyoriy)</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Bo'sh qoldirilsa, doimo ko'rsatiladi
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPinned"
          checked={formData.isPinned}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, isPinned: checked as boolean })
          }
        />
        <Label 
          htmlFor="isPinned" 
          className="text-sm font-normal cursor-pointer"
        >
          Muhim e'lon (yuqorida ko'rsatiladi)
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/admin/announcements">
          <Button type="button" variant="outline">
            Bekor qilish
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            'Yaratish'
          )}
        </Button>
      </div>
    </form>
  )
}

