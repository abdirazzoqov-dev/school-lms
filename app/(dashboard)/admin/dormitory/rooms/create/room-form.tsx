'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { CurrencyInput } from '@/components/ui/currency-input'
import { roomSchema, type RoomFormData } from '@/lib/validations/dormitory'
import { createRoom } from '@/app/actions/dormitory'

interface Building {
  id: string
  name: string
  code: string
  totalFloors: number
}

interface RoomFormProps {
  buildings: Building[]
}

export function RoomForm({ buildings }: RoomFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      buildingId: '',
      roomNumber: '',
      floor: 1,
      capacity: 4,
      roomType: 'STANDARD',
      pricePerMonth: 0, // Default: 0 (bepul yoki alohida belgilanadi)
      gender: undefined,
      description: '',
      amenities: [],
    },
  })

  async function onSubmit(data: RoomFormData) {
    setIsLoading(true)

    const result = await createRoom(data)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Xona yaratildi va joylar avtomatik qo\'shildi',
      })
      router.push('/admin/dormitory/rooms')
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: result.error,
      })
    }

    setIsLoading(false)
  }

  const selectedBuilding = buildings.find(
    (b) => b.id === form.watch('buildingId')
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Asosiy Ma'lumotlar</CardTitle>
            <CardDescription>
              Xona haqida asosiy ma'lumotlarni kiriting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bino *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Binoni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name} ({building.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xona raqami *</FormLabel>
                    <FormControl>
                      <Input placeholder="101" {...field} />
                    </FormControl>
                    <FormDescription>
                      Masalan: 101, A-205
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qavat *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedBuilding &&
                          Array.from(
                            { length: selectedBuilding.totalFloors },
                            (_, i) => i + 1
                          ).map((floor) => (
                            <SelectItem key={floor} value={floor.toString()}>
                              {floor}-qavat
                            </SelectItem>
                          ))}
                        {!selectedBuilding && (
                          <SelectItem value="1">Avval binoni tanlang</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sig'im (joylar soni) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Xonada nechta joy bo'ladi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xona turi *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standart</SelectItem>
                        <SelectItem value="LUXURY">Lux</SelectItem>
                        <SelectItem value="SUITE">Suit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kim uchun</FormLabel>
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
                        <SelectItem value="MALE">O'g'il bolalar</SelectItem>
                        <SelectItem value="FEMALE">Qizlar</SelectItem>
                        <SelectItem value="MIXED">Aralash</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oylik narx *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="500 000"
                        value={Number(field.value)}
                        onChange={(val) => field.onChange(val)}
                        currency="so'm"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value === 0 
                        ? '🎓 Bepul xona — bu xonada yashovchilardan to\'lov olinmaydi'
                        : `${Number(field.value).toLocaleString('uz-UZ')} so'm/oy`
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tavsif</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Xona haqida qo'shimcha ma'lumot..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            Yaratish
          </Button>
        </div>
      </form>
    </Form>
  )
}

