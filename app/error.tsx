'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Xatolik yuz berdi</CardTitle>
          <CardDescription>
            Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Xatolik tafsilotlari:</p>
              <p className="mt-1 text-muted-foreground">{error.message}</p>
              {error.digest && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Qayta urinib ko'rish
            </Button>
            <Button asChild className="flex-1" variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Bosh sahifa
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

