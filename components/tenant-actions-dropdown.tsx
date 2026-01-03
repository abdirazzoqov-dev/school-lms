'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Ban, Unlock, Trash2, AlertTriangle } from 'lucide-react'
import { blockTenant, unblockTenant, deleteTenantWithData } from '@/app/actions/tenant'
import { toast } from 'sonner'

interface TenantActionsDropdownProps {
  tenant: {
    id: string
    name: string
    status: string
    _count?: {
      students: number
      teachers: number
      users: number
    }
  }
}

export function TenantActionsDropdown({ tenant }: TenantActionsDropdownProps) {
  const router = useRouter()
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showUnblockDialog, setShowUnblockDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleBlock = async () => {
    setIsLoading(true)
    try {
      const result = await blockTenant(tenant.id)
      
      if (result.success) {
        toast.success(result.message || 'Maktab bloklandi')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
      setShowBlockDialog(false)
    }
  }

  const handleUnblock = async () => {
    setIsLoading(true)
    try {
      const result = await unblockTenant(tenant.id)
      
      if (result.success) {
        toast.success(result.message || 'Maktab faollashtirildi')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
      setShowUnblockDialog(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await deleteTenantWithData(tenant.id)
      
      if (result.success) {
        toast.success(result.message || 'Maktab o\'chirildi')
        router.push('/super-admin/tenants')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const isBlocked = tenant.status === 'BLOCKED'
  const totalCount = (tenant._count?.students || 0) + (tenant._count?.teachers || 0) + (tenant._count?.users || 0)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Harakatlar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isBlocked ? (
            <DropdownMenuItem onClick={() => setShowUnblockDialog(true)}>
              <Unlock className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600">Blokdan chiqarish</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
              <Ban className="mr-2 h-4 w-4 text-orange-600" />
              <span className="text-orange-600">Bloklash</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Butunlay o'chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-orange-600" />
              Maktabni bloklash
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 pt-2">
                <p><strong>{tenant.name}</strong> maktabini bloklashga aminmisiz?</p>
                
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Bu amal quyidagilarni amalga oshiradi:
                  </p>
                  <ul className="text-sm text-orange-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Maktab statusini BLOCKED ga o'zgartiradi</li>
                    <li>Barcha xodimlar ({tenant._count?.users || 0} ta) deaktiv qilinadi</li>
                    <li>Hech kim login qila olmaydi</li>
                    <li>Ma'lumotlar saqlanadi</li>
                  </ul>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Keyinchalik blokdan chiqarish mumkin.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Bloklanmoqda...' : 'Ha, bloklash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Blokdan chiqarish
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 pt-2">
                <p><strong>{tenant.name}</strong> maktabini blokdan chiqarishga aminmisiz?</p>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Bu amal quyidagilarni amalga oshiradi:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Maktab statusini ACTIVE ga o'zgartiradi</li>
                    <li>Barcha xodimlar ({tenant._count?.users || 0} ta) faollashtiriladi</li>
                    <li>Login qilish imkoniyati qaytadi</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Faollashtirilmoqda...' : 'Ha, faollashtirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              XAVFLI AMAL - Butunlay o'chirish
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 pt-2">
                <p><strong>{tenant.name}</strong> maktabini BUTUNLAY o'chirishga aminmisiz?</p>
                
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ DIQQAT! Bu amal qaytarib bo'lmaydi:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Maktab va BARCHA ma'lumotlar o'chiriladi</li>
                    <li>{tenant._count?.students || 0} ta o'quvchi</li>
                    <li>{tenant._count?.teachers || 0} ta o'qituvchi</li>
                    <li>{tenant._count?.users || 0} ta xodim</li>
                    <li>To'lovlar, baholar, davomat - HAMMASI!</li>
                  </ul>
                </div>
                
                <p className="text-sm font-bold text-red-600">
                  Bu amalni qaytarish MUMKIN EMAS!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'O\'chirilmoqda...' : 'Ha, BUTUNLAY o\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

