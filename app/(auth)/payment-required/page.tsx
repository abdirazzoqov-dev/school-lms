import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function PaymentRequiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
      <Card className="w-full max-w-md border-orange-200">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white">
            <CreditCard className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-orange-600">
              To'lov talab qilinadi
            </CardTitle>
            <CardDescription className="text-base">
              Hisobingiz to'xtatilgan. Xizmatdan foydalanishni davom ettirish uchun to'lov qiling.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-orange-50 p-4">
            <h3 className="mb-2 font-semibold">To'lov uchun:</h3>
            <p className="text-sm text-muted-foreground">
              Maktab administratoringiz bilan bog'laning yoki Super Admin bilan aloqaga chiqing.
            </p>
            <p className="mt-2 text-sm font-medium">
              📞 +998 90 123 45 67<br />
              📧 support@schoollms.uz
            </p>
          </div>
          <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
            <Link href="/">Asosiy sahifa</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Chiqish</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

