'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6">
          <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-white">
            <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold">{platformName}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {platformDescription}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Telefon / Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="+998 90 123 45 67"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-10 sm:h-11"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Qarindoshlar: telefon raqam bilan kiradi
              </p>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">Parol</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-10 sm:h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
              {isLoading ? 'Kirish...' : 'Kirish'}
            </Button>
          </form>
          
          <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
            <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-1.5 sm:space-y-2">
              <p className="font-medium">Demo hisoblar:</p>
              <p>
                <strong>Admin:</strong><br />
                <span className="font-mono text-[10px] sm:text-xs">admin@schoollms.uz</span>
              </p>
              <p>
                <strong>Qarindosh:</strong><br />
                <span className="font-mono text-[10px] sm:text-xs">+998901234567</span><br />
                <span className="text-[9px] sm:text-xs">(Telefon raqam bilan)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
