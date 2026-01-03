'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getGlobalSettings, updateGlobalSettings } from '@/app/actions/global-settings'

export function GeneralSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [settings, setSettings] = useState({
    platformName: 'School LMS',
    platformDescription: 'Maktablar uchun zamonaviy boshqaruv tizimi',
    supportPhone: '+998 71 123 45 67',
    defaultLanguage: 'uz',
    timezone: 'Asia/Tashkent',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsInitialLoading(true)
      const data = await getGlobalSettings()
      setSettings({
        platformName: data.platformName,
        platformDescription: data.platformDescription,
        supportPhone: data.supportPhone,
        defaultLanguage: data.defaultLanguage,
        timezone: data.timezone,
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Sozlamalarni yuklashda xatolik')
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateGlobalSettings(settings)
      toast.success('Sozlamalar saqlandi va butun loyihaga amal qildi!')
      // Reload to show updated settings everywhere
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platformName">Platform Nomi</Label>
          <Input
            id="platformName"
            value={settings.platformName}
            onChange={(e) => setSettings({...settings, platformName: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="platformDescription">Tavsif</Label>
          <Textarea
            id="platformDescription"
            value={settings.platformDescription}
            onChange={(e) => setSettings({...settings, platformDescription: e.target.value})}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supportPhone">Qo'llab-quvvatlash Telefon</Label>
          <Input
            id="supportPhone"
            value={settings.supportPhone}
            onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
          />
          <p className="text-xs text-muted-foreground">
            Maktablar uchun yordam telefoni
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultLanguage">Asosiy Til</Label>
            <Input
              id="defaultLanguage"
              value={settings.defaultLanguage}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Vaqt Zonasi</Label>
            <Input
              id="timezone"
              value={settings.timezone}
              disabled
            />
          </div>
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
