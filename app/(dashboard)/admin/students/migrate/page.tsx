'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { migrateStudentsWithoutUsers } from '@/app/actions/student-migration'
import { ArrowLeft, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function MigrateStudentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrate = async () => {
    if (!confirm('Eski o\'quvchilarga user account yaratmoqchimisiz? Bu bir marta ishlatiladi.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await migrateStudentsWithoutUsers()
      setResult(response)

      if (response.success) {
        toast.success(response.message)
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/admin/students')
          router.refresh()
        }, 3000)
      } else {
        toast.error(response.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
      setResult({ success: false, error: 'Xatolik yuz berdi' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">O'quvchilar Migration</h2>
          <p className="text-muted-foreground">
            Eski o'quvchilarga user account yaratish
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Account Yaratish
          </CardTitle>
          <CardDescription>
            User account bo'lmagan barcha o'quvchilarga avtomatik account yaratiladi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Migration qanday ishlaydi:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>User account bo'lmagan barcha o'quvchilar topiladi</li>
                  <li>Har bir o'quvchi uchun user account yaratiladi</li>
                  <li>Email: <code className="bg-muted px-1">[studentCode]@student.local</code></li>
                  <li>Password: <code className="bg-muted px-1">Student123!</code></li>
                  <li>Ism: Ota-onadan olinadi yoki studentCode ishlatiladi</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{result.message || result.error}</p>
                  {result.success && (
                    <div className="text-sm space-y-1">
                      <p>Jami: {result.total}</p>
                      <p>Muvaffaqiyatli: {result.migrated}</p>
                      {result.errors && (
                        <div className="mt-2">
                          <p className="font-semibold">Xatoliklar:</p>
                          <ul className="list-disc list-inside">
                            {result.errors.slice(0, 5).map((err: string, i: number) => (
                              <li key={i} className="text-xs">{err}</li>
                            ))}
                            {result.errors.length > 5 && (
                              <li className="text-xs">... va yana {result.errors.length - 5} ta</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleMigrate}
              disabled={loading || (result && result.success)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migration...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Migration Boshlash
                </>
              )}
            </Button>

            <Link href="/admin/students">
              <Button variant="outline">
                Bekor qilish
              </Button>
            </Link>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Default Credentials:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> [studentCode]@student.local</p>
              <p><strong>Password:</strong> Student123!</p>
              <p className="text-muted-foreground mt-2">
                Masalan: STD258237 → std258237@student.local
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

