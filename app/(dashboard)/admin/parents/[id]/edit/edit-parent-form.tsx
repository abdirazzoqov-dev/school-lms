'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 ta harf bo\'lishi kerak'),
  email: z.string().email('Email noto\'g\'ri'),
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri').optional().or(z.literal('')),
  relationship: z.string().min(1, 'Qarindoshlik turi majburiy'),
  occupation: z.string().optional().or(z.literal('')),
  workAddress: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

interface Parent {
  id: string
  relationship: string
  occupation: string | null
  workAddress: string | null
  emergencyContact: string | null
  user: {
    fullName: string
    email: string
    phone: string | null
    isActive: boolean
  } | null
}

interface EditParentFormProps {
  parent: Parent
}

export function EditParentForm({ parent }: EditParentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: parent.user?.fullName || '',
      email: parent.user?.email || '',
      phone: parent.user?.phone || '',
      relationship: parent.relationship || '',
      occupation: parent.occupation || '',
      workAddress: parent.workAddress || '',
      emergencyContact: parent.emergencyContact || '',
      isActive: parent.user?.isActive ?? true,
    },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/parents/${parent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Xatolik yuz berdi')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Ota-ona ma\'lumotlari yangilandi',
      })

      router.push(`/admin/parents/${parent.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: error.message || 'Ma\'lumotlarni yangilashda xatolik',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asosiy Ma'lumotlar</CardTitle>
            <CardDescription>
              Ota-onaning shaxsiy ma'lumotlarini kiriting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To'liq ism *</FormLabel>
                    <FormControl>
                      <Input placeholder="Aliyev Ahmad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qarindoshlik *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="father">Ota</SelectItem>
                        <SelectItem value="mother">Ona</SelectItem>
                        <SelectItem value="guardian">Vasiy</SelectItem>
                        <SelectItem value="grandfather">Bobo</SelectItem>
                        <SelectItem value="grandmother">Buvi</SelectItem>
                        <SelectItem value="uncle">Amaki/Tog'a</SelectItem>
                        <SelectItem value="aunt">Xola/Amma</SelectItem>
                        <SelectItem value="other">Boshqa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+998 90 123 45 67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kasb</FormLabel>
                    <FormControl>
                      <Input placeholder="Muhandis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ish joyi manzili</FormLabel>
                    <FormControl>
                      <Input placeholder="Kompaniya nomi, manzil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Favqulodda vaziyat uchun aloqa</FormLabel>
                    <FormControl>
                      <Input placeholder="+998 90 123 45 67" {...field} />
                    </FormControl>
                    <FormDescription>
                      Asosiy telefon ishlamasa, bu raqamga qo'ng'iroq qilinadi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Faol hisob</FormLabel>
                    <FormDescription>
                      Nofaol hisoblar tizimga kira olmaydi
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  )
}

