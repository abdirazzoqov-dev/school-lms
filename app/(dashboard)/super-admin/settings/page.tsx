'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Shield, Database, CreditCard } from 'lucide-react'
import { GeneralSettings } from './general-settings'
import { SecuritySettings } from './security-settings'
import { BackupSettings } from './backup-settings'
import { SubscriptionPlans } from './subscription-plans'
import { ClearCacheButton } from '@/components/clear-cache-button'

export default function SuperAdminSettingsPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Yuklanmoqda...</div>
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tizim Sozlamalari</h1>
          <p className="text-muted-foreground">
            Platformaning barcha sozlamalarini boshqaring
          </p>
        </div>
        <ClearCacheButton />
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Umumiy</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Xavfsizlik</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Zaxira</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Tarif Rejalar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy Sozlamalar</CardTitle>
              <CardDescription>
                Platformaning asosiy sozlamalarini o'zgartiring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Xavfsizlik Sozlamalari</CardTitle>
              <CardDescription>
                Tizim xavfsizligi va autentifikatsiya sozlamalarini o'zgartiring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Zaxira Nusxa Sozlamalari</CardTitle>
              <CardDescription>
                Ma'lumotlar bazasining zaxira nusxasini boshqaring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Obuna Tariflari</CardTitle>
              <CardDescription>
                Maktablar uchun obuna tariflarini boshqaring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionPlans />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

