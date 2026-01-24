'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Home, BedDouble, User, GraduationCap, DollarSign, CheckCircle } from 'lucide-react'
import { createAssignment } from '@/app/actions/dormitory'
import { Textarea } from '@/components/ui/textarea'

interface Student {
  id: string
  studentCode: string
  gender: 'MALE' | 'FEMALE'
  user: {
    fullName: string
  } | null
  class: {
    name: string
  } | null
}

interface AssignStudentFormProps {
  students: Student[]
}

export function AssignStudentForm({ students }: AssignStudentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [selectedBedId, setSelectedBedId] = useState('')
  const [monthlyFee, setMonthlyFee] = useState(0)
  const [notes, setNotes] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load available rooms when student is selected
  useEffect(() => {
    if (selectedStudent) {
      setLoadingRooms(true)
      setSelectedRoom(null)
      setSelectedBedId('')
      
      fetch(`/api/dormitory/available-rooms?gender=${selectedStudent.gender}`)
        .then(res => res.json())
        .then(data => {
          setAvailableRooms(data.rooms || [])
          setLoadingRooms(false)
        })
        .catch(() => {
          setLoadingRooms(false)
          setAvailableRooms([])
        })
    } else {
      setAvailableRooms([])
      setSelectedRoom(null)
      setSelectedBedId('')
    }
  }, [selectedStudent])

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId)
    const student = students.find(s => s.id === studentId)
    setSelectedStudent(student || null)
  }

  const handleSubmit = async () => {
    if (!selectedStudentId || !selectedBedId) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'O\'quvchi va joyni tanlang',
      })
      return
    }

    setIsSubmitting(true)

    const result = await createAssignment({
      studentId: selectedStudentId,
      roomId: selectedRoom.id,
      bedId: selectedBedId,
      monthlyFee,
      notes,
    })

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: result.message || 'O\'quvchi yotoqxonaga joylashtirildi',
      })
      
      // Show additional info about payment creation
      if (result.paymentCreated) {
        setTimeout(() => {
          toast({
            title: '💰 To\'lov yaratildi',
            description: `Yotoqxona to'lovi avtomatik yaratildi. Moliya → To'lovlar sahifasida ko'rishingiz mumkin.`,
          })
        }, 1500)
      }
      
      router.push('/admin/dormitory')
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: result.error,
      })
    }

    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Student */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            1. O'quvchini tanlang
          </CardTitle>
          <CardDescription>
            Yotoqxonaga joylashtirmoqchi bo'lgan o'quvchini tanlang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>O'quvchi</Label>
            <Select value={selectedStudentId} onValueChange={handleStudentChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="O'quvchini tanlang" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.user?.fullName || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">
                        ({student.studentCode})
                      </span>
                      {student.class && (
                        <Badge variant="outline" className="text-xs">
                          {student.class.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className={
                        student.gender === 'MALE' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-pink-50 text-pink-700'
                      }>
                        {student.gender === 'MALE' ? 'O\'g\'il bola' : 'Qiz'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">
                    {selectedStudent.user?.fullName}
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedStudent.studentCode} • {selectedStudent.class?.name || 'Sinfsiz'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Room */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              2. Xona va joyni tanlang
            </CardTitle>
            <CardDescription>
              {selectedStudent.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'} uchun mavjud bo'sh joylar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRooms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground">Bo'sh xonalar yuklanmoqda...</p>
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/50">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedStudent.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'} uchun bo'sh xonalar yo'q
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedRoom?.id === room.id
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => {
                      setSelectedRoom(room)
                      const fee = Number(room.pricePerMonth) || 0
                      console.log('🏠 Room selected:', room.roomNumber, 'pricePerMonth:', room.pricePerMonth, 'parsed:', fee)
                      setMonthlyFee(fee)
                      setSelectedBedId('') // Reset bed selection
                      
                      if (fee === 0) {
                        toast({
                          variant: 'destructive',
                          title: 'Ogohlantirish!',
                          description: `${room.roomNumber}-xonaning oylik to'lovi 0 ga teng. To'lov yaratilmaydi!`,
                        })
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">Xona {room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.building.name} - {room.floor}-qavat
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {room.beds.length} bo'sh
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Narx:</span>
                      <span className={`font-semibold ${Number(room.pricePerMonth) === 0 ? 'text-red-600' : ''}`}>
                        {Number(room.pricePerMonth).toLocaleString()} so'm/oy
                        {Number(room.pricePerMonth) === 0 && (
                          <span className="text-xs text-red-600 ml-1">⚠️ To'lov yaratilmaydi</span>
                        )}
                      </span>
                    </div>

                    {/* Bed selection */}
                    {selectedRoom?.id === room.id && (
                      <div className="space-y-2 pt-3 border-t">
                        <Label className="text-xs">Joyni tanlang:</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {room.beds.map((bed: any) => (
                            <button
                              key={bed.id}
                              type="button"
                              className={`p-3 text-sm rounded border-2 transition-colors flex items-center justify-center ${
                                selectedBedId === bed.id
                                  ? 'bg-green-500 text-white border-green-600'
                                  : 'bg-white border-gray-300 hover:border-green-400'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBedId(bed.id)
                              }}
                            >
                              <BedDouble className="h-4 w-4 mr-1" />
                              {bed.bedNumber}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Additional Info & Submit */}
      {selectedBedId && selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              3. Tasdiqlash
            </CardTitle>
            <CardDescription>
              Ma'lumotlarni tekshiring va tasdiqlang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-green-900">
                Joylashtirish Ma'lumotlari
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-green-700">O'quvchi</p>
                      <p className="font-semibold text-green-900">
                        {selectedStudent?.user?.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700">Sinf</p>
                      <p className="font-semibold text-blue-900">
                        {selectedStudent?.class?.name || 'Sinfsiz'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs text-indigo-700">Xona va Joy</p>
                      <p className="font-semibold text-indigo-900">
                        Xona {selectedRoom.roomNumber} - Joy #{selectedRoom.beds.find((b: any) => b.id === selectedBedId)?.bedNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs text-orange-700">Oylik to'lov</p>
                      <p className="font-semibold text-orange-900">
                        {monthlyFee.toLocaleString()} so'm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Izoh (ixtiyoriy)</Label>
              <Textarea
                placeholder="Qo'shimcha ma'lumot..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Joylashtirishni Tasdiqlash
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

