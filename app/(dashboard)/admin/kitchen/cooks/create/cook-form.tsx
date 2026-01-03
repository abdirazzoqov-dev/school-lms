'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { cookSchema, CookFormData } from '@/lib/validations/cook'
import { createCook } from '@/app/actions/cook'
import { Loader2, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function CookForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CookFormData>({
    resolver: zodResolver(cookSchema),
    defaultValues: {
      position: 'COOK',
    },
  })

  const onSubmit = async (data: CookFormData) => {
    setIsLoading(true)
    try {
      const result = await createCook(data)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Oshpaz yaratildi',
        })
        
        if (result.credentials) {
          setCredentials(result.credentials)
        } else {
          router.push('/admin/kitchen/cooks')
        }
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
        description: 'Nimadir xato ketdi',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyCredentials = () => {
    if (credentials) {
      const text = `Email: ${credentials.email}\nParol: ${credentials.password}`
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Show credentials after successful creation
  if (credentials) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-semibold">Oshpaz Muvaffaqiyatli Yaratildi!</h3>
          <p className="text-muted-foreground">
            Quyidagi ma'lumotlarni oshpazga yuboring
          </p>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <Label className="text-green-700">Email:</Label>
                <p className="font-mono text-lg">{credentials.email}</p>
              </div>
              <div>
                <Label className="text-green-700">Parol:</Label>
                <p className="font-mono text-lg">{credentials.password}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={copyCredentials} variant="outline" className="flex-1">
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Nusxa olindi!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Nusxa olish
              </>
            )}
          </Button>
          <Button onClick={() => router.push('/admin/kitchen/cooks')} className="flex-1">
            Ro'yxatga qaytish
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Shaxsiy Ma'lumotlar</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">To'liq Ism *</Label>
            <Input
              id="fullName"
              placeholder="Abdullayev Sardor"
              {...register('fullName')}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cookCode">Oshpaz Kodi *</Label>
            <Input
              id="cookCode"
              placeholder="COOK001"
              {...register('cookCode')}
              disabled={isLoading}
            />
            {errors.cookCode && (
              <p className="text-sm text-red-500">{errors.cookCode.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="sardor@maktab.uz"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              placeholder="+998 90 123 45 67"
              {...register('phone')}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Parol *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Kamida 6 ta belgi"
              {...register('password')}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      {/* Work Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Ish Ma'lumotlari</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="position">Lavozim *</Label>
            <Select
              defaultValue="COOK"
              onValueChange={(value) => setValue('position', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lavozimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HEAD_COOK">Bosh Oshpaz</SelectItem>
                <SelectItem value="COOK">Oshpaz</SelectItem>
                <SelectItem value="ASSISTANT">Yordamchi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Mutaxassislik *</Label>
            <Input
              id="specialization"
              placeholder="Milliy taomlar, Shirinliklar"
              {...register('specialization')}
              disabled={isLoading}
            />
            {errors.specialization && (
              <p className="text-sm text-red-500">{errors.specialization.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="experienceYears">Tajriba (yil)</Label>
            <Input
              id="experienceYears"
              type="number"
              min="0"
              placeholder="5"
              {...register('experienceYears', { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Oylik maosh (so'm)</Label>
            <Input
              id="salary"
              type="number"
              min="0"
              placeholder="3000000"
              {...register('salary', { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workSchedule">Ish grafigi</Label>
          <Input
            id="workSchedule"
            placeholder="Dushanba-Juma, 07:00-16:00"
            {...register('workSchedule')}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1"
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1 bg-orange-500 hover:bg-orange-600">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yaratilmoqda...
            </>
          ) : (
            'Oshpaz Yaratish'
          )}
        </Button>
      </div>
    </form>
  )
}

