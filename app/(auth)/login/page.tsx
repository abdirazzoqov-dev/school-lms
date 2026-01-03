'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [platformName, setPlatformName] = useState('School LMS')
  const [platformDescription, setPlatformDescription] = useState('Maktab boshqaruv tizimiga xush kelibsiz')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Load global settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/global-settings')
        if (response.ok) {
          const data = await response.json()
          setPlatformName(data.platformName)
          setPlatformDescription(data.platformDescription)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Redirect based on role
      switch (session.user.role) {
        case 'SUPER_ADMIN':
          router.replace('/super-admin')
          break
        case 'ADMIN':
          router.replace('/admin')
          break
        case 'TEACHER':
          router.replace('/teacher')
          break
        case 'PARENT':
          router.replace('/parent')
          break
        case 'STUDENT':
          router.replace('/student')
          break
        case 'COOK':
          router.replace('/cook')
          break
        default:
          router.replace('/')
      }
    }
  }, [status, session, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Xato!',
          description: result.error,
        })
      } else {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Tizimga kirildi',
        })
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Nimadir xato ketdi',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
            <GraduationCap className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">{platformName}</CardTitle>
            <CardDescription className="text-base">
              {platformDescription}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Telefon / Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="+998 90 123 45 67 yoki email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Qarindoshlar: telefon raqam bilan kiradi
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Kirish...' : 'Kirish'}
            </Button>
          </form>
          
          <div className="mt-6 border-t pt-6">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Demo hisoblar:</p>
              <p>
                <strong>Admin:</strong><br />
                <span className="font-mono">admin@schoollms.uz</span>
              </p>
              <p>
                <strong>Qarindosh:</strong><br />
                <span className="font-mono">+998901234567</span><br />
                <span className="text-xs">(Telefon raqam bilan)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
