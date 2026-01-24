'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, Wrench } from 'lucide-react'
import { fixRoomsWithZeroPrice } from '@/app/actions/dormitory'
import { useToast } from '@/components/ui/use-toast'
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

export function FixRoomsButton() {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFix = async () => {
    setIsProcessing(true)

    try {
      const result = await fixRoomsWithZeroPrice()

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: result.message || 'Xonalar tuzatildi',
        })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          title: 'Xato!',
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Xatolik yuz berdi',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wrench className="h-4 w-4 mr-2" />
          Xonalarni tuzatish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Xonalarni tuzatish
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Bu amal <strong>narxi 0 so&apos;m</strong> bo&apos;lgan barcha xonalarni <strong>250,000 so&apos;m</strong> ga o&apos;zgartiradi.
            </p>
            <p className="text-orange-600 font-medium">
              Davom ettirishni xohlaysizmi?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={handleFix} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Tuzatilmoqda...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Ha, tuzatish
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

