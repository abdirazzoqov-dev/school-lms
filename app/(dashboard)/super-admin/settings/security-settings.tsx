'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    twoFactorEnabled: false,
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Xavfsizlik sozlamalari saqlandi')
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sessionTimeout">Session Timeout (daqiqa)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
          />
          <p className="text-xs text-muted-foreground">
            Foydalanuvchi aktivsiz qolgandan keyin session tugash vaqti
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxLoginAttempts">Maksimal Login Urinishlari</Label>
          <Input
            id="maxLoginAttempts"
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordMinLength">Parol Minimal Uzunligi</Label>
          <Input
            id="passwordMinLength"
            type="number"
            value={settings.passwordMinLength}
            onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
          />
        </div>

        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="requireStrongPassword">Kuchli Parol Talab Qilish</Label>
            <p className="text-sm text-muted-foreground">
              Katta/kichik harf, raqam va maxsus belgilar
            </p>
          </div>
          <Switch
            id="requireStrongPassword"
            checked={settings.requireStrongPassword}
            onCheckedChange={(checked) => setSettings({...settings, requireStrongPassword: checked})}
          />
        </div>

        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="twoFactorEnabled">Ikki Faktorli Autentifikatsiya</Label>
            <p className="text-sm text-muted-foreground">
              SMS yoki email orqali tasdiqlash (keyingi versiyada)
            </p>
          </div>
          <Switch
            id="twoFactorEnabled"
            checked={settings.twoFactorEnabled}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
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
      </div>
    </div>
  )
}
