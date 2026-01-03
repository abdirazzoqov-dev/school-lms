'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Database, Download, Loader2, HardDrive, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export function BackupSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)

  const handleBackupNow = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Zaxira nusxa yaratildi')
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadBackup = () => {
    toast.info('Yuklab olish boshlandi')
  }

  return (
    <div className="space-y-6">
      {/* Auto Backup */}
      <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="autoBackup">Avtomatik Zaxira Nusxa</Label>
          <p className="text-sm text-muted-foreground">
            Har kuni soat 02:00 da avtomatik zaxira yaratiladi
          </p>
        </div>
        <Switch
          id="autoBackup"
          checked={autoBackup}
          onCheckedChange={setAutoBackup}
        />
      </div>

      {/* Backup Now */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Hozir Zaxiralash</h3>
                <p className="text-sm text-muted-foreground">
                  Barcha ma'lumotlarning zaxira nusxasini yaratish
                </p>
              </div>
            </div>
            <Button onClick={handleBackupNow} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                <>
                  <HardDrive className="mr-2 h-4 w-4" />
                  Zaxiralash
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Backups */}
      <div className="space-y-3">
        <h3 className="font-semibold">Oxirgi Zaxira Nusxalar</h3>
        
        {[
          { date: '30 Noyabr 2025, 02:00', size: '156 MB' },
          { date: '29 Noyabr 2025, 02:00', size: '154 MB' },
          { date: '28 Noyabr 2025, 02:00', size: '152 MB' },
        ].map((backup, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{backup.date}</p>
                    <p className="text-sm text-muted-foreground">{backup.size}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadBackup}>
                  <Download className="mr-2 h-4 w-4" />
                  Yuklash
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
        <p className="text-sm text-orange-800">
          <strong>⚠️ Eslatma:</strong> Zaxira nusxalar server'da 30 kun saqlanadi. 
          Muhim zaxiralarni yuklab olib saqlashni unutmang.
        </p>
      </div>
    </div>
  )
}
