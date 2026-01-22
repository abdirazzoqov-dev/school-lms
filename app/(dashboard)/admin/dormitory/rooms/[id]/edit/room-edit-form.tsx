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
import { updateRoomSchema, type RoomFormData } from '@/lib/validations/dormitory'
import { updateRoom } from '@/app/actions/dormitory'

interface Building {
  id: string
  name: string
  code: string
  totalFloors: number
}

interface Room {
  id: string
  buildingId: string
  roomNumber: string
  floor: number
  capacity: number
  roomType: string
  pricePerMonth: number | string
  gender: 'MALE' | 'FEMALE' | null
  description: string | null
  amenities: any
  building: Building
}

interface RoomEditFormProps {
  room: Room
  buildings: Building[]
}

export function RoomEditForm({ room, buildings }: RoomEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RoomFormData>({
    resolver: zodResolver(updateRoomSchema),
    defaultValues: {
      buildingId: room.buildingId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      roomType: room.roomType,
      pricePerMonth: Number(room.pricePerMonth),
      gender: room.gender ? room.gender : 'MIXED',
      description: room.description || '',
      amenities: room.amenities || [],
    },
  })

  async function onSubmit(data: RoomFormData) {
    setIsLoading(true)

    const result = await updateRoom(room.id, data)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Xona ma\'lumotlari yangilandi',
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
              Xona haqida asosiy ma'lumotlarni o'zgartiring
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
                        <SelectItem value="LUXURY">Lyuks</SelectItem>
                        <SelectItem value="SUITE">Suit</SelectItem>
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
                    <FormLabel>Oylik narx (so'm) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
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
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  )
}

