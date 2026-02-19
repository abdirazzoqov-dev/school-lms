'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Shield, Save } from 'lucide-react'
import { StaffPermissionMatrix, matrixToPermissionInputs } from '@/components/admin/staff-permission-matrix'
import { saveStaffPermissions } from '@/app/actions/staff-permissions'
import type { PermissionMatrix } from '@/components/admin/staff-permission-matrix'

interface Props {
  staffUserId: string
  staffName: string
  initialPermissions: PermissionMatrix
}

export function StaffPermissionsEditClient({ staffUserId, staffName, initialPermissions }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<PermissionMatrix>(initialPermissions)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const inputs = matrixToPermissionInputs(permissions)
      const result = await saveStaffPermissions(staffUserId, inputs)
      if (result.success) {
        toast({ title: 'Muvaffaqiyatli!', description: `${staffName} uchun ruxsatlar yangilandi` })
        router.refresh()
      } else {
        toast({ title: 'Xato!', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Xato!', description: 'Kutilmagan xatolik', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-cyan-200 bg-cyan-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-cyan-600" />
            Panel Ruxsatlari — {staffName}
          </CardTitle>
          <CardDescription>
            Xodim tizimga kirganida qaysi sahifalarda qanday amallar bajara olishini belgilang.
            O'zgarishlar darhol kuchga kiradi.
          </CardDescription>
        </CardHeader>
      </Card>

      <StaffPermissionMatrix value={permissions} onChange={setPermissions} />

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saqlanmoqda...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Ruxsatlarni Saqlash</>
          )}
        </Button>
      </div>
    </div>
  )
}

