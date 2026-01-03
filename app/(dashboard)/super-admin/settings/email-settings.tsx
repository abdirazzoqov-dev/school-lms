'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Checkbox } from '@/components/ui/checkbox'

export function EmailSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: 'Email sozlamalari saqlandi',
      description: 'SMTP sozlamalari muvaffaqiyatli yangilandi',
    })

    setIsLoading(false)
  }

  const handleTestEmail = async () => {
    setIsTesting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    toast({
      title: 'Test email yuborildi',
      description: 'Email manzilingizni tekshiring',
    })

    setIsTesting(false)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input
              id="smtp-host"
              defaultValue="smtp.gmail.com"
              placeholder="smtp.example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtp-port">SMTP Port</Label>
            <Input
              id="smtp-port"
              type="number"
              defaultValue="587"
              placeholder="587"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtp-user">SMTP Foydalanuvchi</Label>
            <Input
              id="smtp-user"
              type="email"
              defaultValue="noreply@schoollms.uz"
              placeholder="user@example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="smtp-password">SMTP Parol</Label>
            <Input
              id="smtp-password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="from-email">Yuboruvchi Email</Label>
            <Input
              id="from-email"
              type="email"
              defaultValue="noreply@schoollms.uz"
              placeholder="noreply@example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="from-name">Yuboruvchi Nomi</Label>
            <Input
              id="from-name"
              defaultValue="School LMS"
              placeholder="Platform nomi"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="enable-ssl" defaultChecked />
            <Label htmlFor="enable-ssl" className="cursor-pointer">
              SSL/TLS yoqish
            </Label>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestEmail}
            disabled={isTesting}
          >
            {isTesting ? 'Yuborilmoqda...' : 'Test Email Yuborish'}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </div>
  )
}

