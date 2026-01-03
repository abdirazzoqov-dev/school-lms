'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteSubject } from '@/app/actions/subject'
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

interface DeleteSubjectButtonProps {
  subjectId: string
  subjectName: string
  hasSchedules: boolean
  hasClassSubjects: boolean
}

export function DeleteSubjectButton({ 
  subjectId, 
  subjectName, 
  hasSchedules,
  hasClassSubjects 
}: DeleteSubjectButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const canDelete = !hasSchedules && !hasClassSubjects

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteSubject(subjectId)

      if (result.success) {
        toast.success('Fan o\'chirildi')
        router.refresh()
        setOpen(false)
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={!canDelete}
          title={!canDelete ? 'Bu fan ishlatilmoqda' : 'O\'chirish'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fanni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">{subjectName}</span> fanini o'chirmoqchimisiz?
            <br />
            Bu amalni qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                O'chirilmoqda...
              </>
            ) : (
              'O\'chirish'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

