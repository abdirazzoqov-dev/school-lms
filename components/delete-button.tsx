'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteButtonProps {
  itemId: string
  itemName: string
  itemType: 'tenant' | 'student' | 'teacher' | 'class' | 'payment' | 'material' | 'announcement' | 'schedule' | 'message'
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  confirmText?: string
}

export function DeleteButton({
  itemId,
  itemName,
  itemType,
  onDelete,
  variant = 'destructive',
  size = 'sm',
  showIcon = true,
  confirmText,
}: DeleteButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const typeLabels = {
    tenant: 'Maktab',
    student: 'O\'quvchi',
    teacher: 'O\'qituvchi',
    class: 'Sinf',
    payment: 'To\'lov',
    material: 'Material',
    announcement: 'E\'lon',
    schedule: 'Dars jadvali',
    message: 'Xabar',
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const result = await onDelete(itemId)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: (result as any).message || `${typeLabels[itemType]} o'chirildi`,
          duration: 5000,
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: 'Xato!',
          description: result.error || 'Xatolik yuz berdi',
          variant: 'destructive',
          duration: 7000,
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {showIcon && <Trash2 className="h-4 w-4 mr-2" />}
              O'chirish
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>{itemName}</strong> {confirmText || `${typeLabels[itemType].toLowerCase()}ni o'chirmoqdasiz.`}
            </p>
            {itemType === 'student' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-1">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Diqqat: O'chirish shartlari
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Agar qarzi bo'lsa, o'chirib bo'lmaydi</li>
                  <li>Barcha to'lovlar to'langan bo'lishi kerak</li>
                  <li>Barcha ma'lumotlar butunlay o'chib ketadi</li>
                </ul>
              </div>
            )}
            <p className="text-red-600 font-medium">
              Bu amalni qaytarib bo'lmaydi!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ha, O'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

