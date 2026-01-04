'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Jiddiy xatolik</CardTitle>
              <CardDescription>
                Tizimda jiddiy xatolik yuz berdi. Iltimos, sahifani yangilang yoki keyinroq urinib ko'ring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={reset} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sahifani yangilash
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

