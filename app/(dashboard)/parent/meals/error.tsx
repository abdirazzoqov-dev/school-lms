'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Parent meals page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full border-2 border-red-200 shadow-2xl">
        <CardContent className="p-6 sm:p-8 md:p-10">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Xatolik yuz berdi
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Ovqatlar menyusini yuklashda muammo yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={reset}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCcw className="mr-2 h-5 w-5" />
                Qayta yuklash
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
              >
                <Link href="/parent">
                  <Home className="mr-2 h-5 w-5" />
                  Bosh sahifa
                </Link>
              </Button>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-gray-500">
                Muammo davom etsa, maktab administratsiyasi bilan bog'laning
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
