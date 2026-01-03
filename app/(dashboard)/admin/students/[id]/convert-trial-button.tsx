'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { convertTrialToRegular } from '@/app/actions/student'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, Loader2 } from 'lucide-react'
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

interface ConvertTrialButtonProps {
  studentId: string
  studentName: string
}

export function ConvertTrialButton({ studentId, studentName }: ConvertTrialButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    setLoading(true)
    
    try {
      const result = await convertTrialToRegular(studentId)
      
      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: result.message,
        })
        router.refresh()
      } else {
        toast({
          title: 'Xato!',
          description: result.error,
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          Asosiy o'quvchiga aylantirish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Asosiy o'quvchiga aylantirish</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">{studentName}</span> ni sinov muddatidan asosiy o'quvchilar ro'yxatiga o'tkazmoqchimisiz?
            <br /><br />
            Bu amal orqali:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Sinov muddati o'chiriladi</li>
              <li>O'quvchi to'liq huquqli o'quvchi bo'ladi</li>
              <li>Barcha funksiyalar doimiy bo'ladi</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConvert}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Jarayonda...
              </>
            ) : (
              'Tasdiqlash'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

