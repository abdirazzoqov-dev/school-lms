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
import { UserX, Loader2 } from 'lucide-react'

interface DeactivateButtonProps {
  itemId: string
  itemName: string
  itemType: 'student' | 'teacher'
  onDeactivate: (id: string) => Promise<{ success: boolean; error?: string }>
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function DeactivateButton({
  itemId,
  itemName,
  itemType,
  onDeactivate,
  variant = 'outline',
  size = 'sm',
}: DeactivateButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const typeLabels = {
    student: 'O\'quvchi',
    teacher: 'O\'qituvchi',
  }

  const handleDeactivate = async () => {
    setLoading(true)

    try {
      const result = await onDeactivate(itemId)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: `${typeLabels[itemType]} deaktivatsiya qilindi`,
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: 'Xato!',
          description: result.error || 'Xatolik yuz berdi',
          variant: 'destructive',
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
              <UserX className="h-4 w-4 mr-2" />
              Deaktivatsiya
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deaktivatsiya qilish</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>{itemName}</strong> {typeLabels[itemType].toLowerCase()}ni deaktivatsiya qilmoqdasiz.
            </p>
            {itemType === 'student' && (
              <p className="text-muted-foreground">
                O'quvchi statusga EXPELLED ga o'zgaradi va sinfdan chiqariladi. Baholar va to'lovlar saqlanadi.
              </p>
            )}
            {itemType === 'teacher' && (
              <p className="text-muted-foreground">
                O'qituvchi tizimga kira olmaydi, lekin barcha ma'lumotlar saqlanadi.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeactivate}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deaktivatsiya
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

