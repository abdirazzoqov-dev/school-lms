import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ban } from 'lucide-react'

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white">
            <Ban className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-destructive">
              Hisobingiz bloklangan
            </CardTitle>
            <CardDescription className="text-base">
              Sizning maktab hisobingiz bloklangan. <br />
              Administrator bilan bog'laning.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <p className="text-sm font-medium">
              Aloqa:<br />
              <a href="mailto:support@schoollms.uz" className="text-primary hover:underline">
                support@schoollms.uz
              </a>
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Login sahifasiga qaytish</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

