'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { updateStudent } from '@/app/actions/student'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2, Users, Home, Plus, X, Radio } from 'lucide-react'
import Link from 'next/link'
import type { GuardianFormData } from '@/lib/validations/student'

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [assignmentType, setAssignmentType] = useState<'class' | 'group' | 'none'>('none')
  const [needsDormitory, setNeedsDormitory] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [loadingRooms, setLoadingRooms] = useState(false)
  
  // Guardian state
  const [guardians, setGuardians] = useState<GuardianFormData[]>([
    {
      fullName: '',
      phone: '',
      guardianType: 'FATHER',
      customRelationship: '',
      hasAccess: true,
      occupation: '',
      workAddress: '',
    }
  ])
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentCode: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    classId: '',
    groupId: '',
    address: '',
    trialEnabled: false,
    trialDays: 30,
    dormitoryBedId: '',
    dormitoryMonthlyFee: 0,
    monthlyTuitionFee: 0,
    paymentDueDay: 5,
  })

  useEffect(() => {
    // Load student, classes, groups data
    Promise.all([
      fetch(`/api/students/${params.id}`).then(res => res.json()),
      fetch('/api/admin/classes').then(res => res.json()),
      fetch('/api/admin/groups').then(res => res.json())
    ]).then(([studentData, classesData, groupsData]) => {
      if (studentData.student) {
        const student = studentData.student
        
        // Determine assignment type
        let assignmentTypeValue: 'class' | 'group' | 'none' = 'none'
        if (student.classId) {
          assignmentTypeValue = 'class'
        } else if (student.groupId) {
          assignmentTypeValue = 'group'
        }
        setAssignmentType(assignmentTypeValue)
        
        setFormData({
          fullName: student.user?.fullName || '',
          email: student.user?.email || '',
          studentCode: student.studentCode,
          dateOfBirth: student.dateOfBirth 
            ? new Date(student.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: student.gender,
          classId: student.classId || '',
          groupId: student.groupId || '',
          address: student.address || '',
          trialEnabled: student.trialEnabled || false,
          trialDays: student.trialDays || 30,
          dormitoryBedId: student.dormitoryAssignment?.bedId || '',
          dormitoryMonthlyFee: Number(student.dormitoryAssignment?.monthlyFee || 0),
          monthlyTuitionFee: Number(student.monthlyTuitionFee || 0),
          paymentDueDay: student.paymentDueDay || 5,
        })

        // Set dormitory status
        if (student.dormitoryAssignment) {
          setNeedsDormitory(true)
          // Load current dormitory info to pre-select room
          fetch(`/api/admin/dormitory/available-rooms?gender=${student.gender}`, {
            cache: 'no-store',
            credentials: 'include',
          })
            .then(res => res.json())
            .then(data => {
              const rooms = data.rooms || []
              // Find the room that contains the current bed
              const currentRoom = rooms.find((r: any) => 
                r.beds.some((b: any) => b.id === student.dormitoryAssignment.bedId)
              )
              if (currentRoom) {
                setSelectedRoom(currentRoom)
              }
              setAvailableRooms(rooms)
            })
            .catch(() => {
              setAvailableRooms([])
            })
        }

        // Load guardians if exists
        if (student.parents && student.parents.length > 0) {
          const loadedGuardians = student.parents.map((sp: any) => ({
            fullName: sp.parent.user?.fullName || '',
            phone: sp.parent.user?.phone || '',
            guardianType: sp.relationshipType || 'OTHER',
            customRelationship: sp.customRelationship || '',
            hasAccess: sp.parent.user?.email ? true : false,
            occupation: sp.parent.occupation || '',
            workAddress: sp.parent.workAddress || '',
            parentId: sp.parent.id, // Keep track for updates
          }))
          setGuardians(loadedGuardians)
        }
      }
      setClasses(classesData.classes || [])
      setGroups(groupsData.groups || [])
      setDataLoading(false)
    }).catch((error) => {
      console.error('Error loading data:', error)
      toast({
        title: 'Xato!',
        description: 'Ma\'lumotlarni yuklashda xatolik',
        variant: 'destructive',
      })
      setDataLoading(false)
    })
  }, [params.id, toast])

  useEffect(() => {
    // Load available rooms when dormitory is needed and gender is selected
    if (needsDormitory && formData.gender) {
      console.log('🛏️  Loading available dormitory rooms for gender:', formData.gender)
      setLoadingRooms(true)
      fetch(`/api/admin/dormitory/available-rooms?gender=${formData.gender}`, {
        cache: 'no-store',
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          console.log('📡 Available rooms response:', data)
          setAvailableRooms(data.rooms || [])
          setLoadingRooms(false)
          if (data.rooms && data.rooms.length > 0) {
            toast({
              title: 'Yotoqxona xonalari yuklandi',
              description: `${data.rooms.length} ta bo'sh joy topildi`,
            })
          } else {
            toast({
              title: 'Bo\'sh joylar yo\'q',
              description: 'Hozircha bu jins uchun bo\'sh yotoqxona joylari yo\'q',
              variant: 'destructive',
            })
          }
        })
        .catch((error) => {
          console.error('❌ Failed to load rooms:', error)
          setLoadingRooms(false)
          setAvailableRooms([])
          toast({
            title: 'Xato',
            description: 'Yotoqxona xonalarini yuklashda xato',
            variant: 'destructive',
          })
        })
    } else {
      setAvailableRooms([])
      setSelectedRoom(null)
      setFormData(prev => ({ ...prev, dormitoryBedId: '', dormitoryMonthlyFee: 0 }))
    }
  }, [needsDormitory, formData.gender, toast])

  // Guardian functions
  const addGuardian = () => {
    setGuardians(prev => [...prev, {
      fullName: '',
      phone: '',
      guardianType: 'MOTHER',
      customRelationship: '',
      hasAccess: false,
      occupation: '',
      workAddress: '',
    }])
  }

  const removeGuardian = (index: number) => {
    if (guardians.length === 1) {
      toast({
        title: 'Diqqat!',
        description: 'Kamida bitta qarindosh bo\'lishi kerak',
        variant: 'destructive'
      })
      return
    }
    setGuardians(prev => {
      const newGuardians = prev.filter((_, i) => i !== index)
      // Agar o'chirilgan qarindosh nazoratchi bo'lsa, birinchisini nazoratchi qilib qo'yamiz
      if (prev[index].hasAccess && newGuardians.length > 0) {
        newGuardians[0].hasAccess = true
      }
      return newGuardians
    })
  }

  const updateGuardian = (index: number, field: keyof GuardianFormData, value: any) => {
    setGuardians(prev => {
      const newGuardians = [...prev]
      newGuardians[index] = { ...newGuardians[index], [field]: value }
      return newGuardians
    })
  }

  const setGuardianAccess = (index: number) => {
    setGuardians(prev => prev.map((g, i) => ({
      ...g,
      hasAccess: i === index
    })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const hasAccessCount = guardians.filter(g => g.hasAccess).length
    if (hasAccessCount !== 1) {
      toast({
        title: 'Xato',
        description: 'Faqat bitta qarindoshga nazorat paneliga kirish huquqi bering',
        variant: 'destructive'
      })
      return
    }

    for (const guardian of guardians) {
      if (guardian.guardianType === 'OTHER' && !guardian.customRelationship) {
        toast({
          title: 'Xato',
          description: 'Qarindoshlik turini kiriting (masalan: Amaki, Xola)',
          variant: 'destructive'
        })
        return
      }
    }

    if (formData.monthlyTuitionFee < 0) {
      toast({
        title: 'Xato',
        description: 'Oylik o\'qish to\'lov summasi 0 dan kichik bo\'lishi mumkin emas',
        variant: 'destructive'
      })
      return
    }

    if (formData.trialEnabled && (!formData.trialDays || formData.trialDays < 1)) {
      toast({
        title: 'Xato',
        description: 'Sinov muddati yoqilgan bo\'lsa, sinov davomiyligini kiriting (kamida 1 kun)',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    // ✅ Debug: Log data being sent
    console.log('=== UPDATING STUDENT ===')
    console.log('Student ID:', params.id)
    console.log('Monthly Tuition Fee:', formData.monthlyTuitionFee)
    console.log('Dormitory Monthly Fee:', formData.dormitoryMonthlyFee)
    console.log('Dormitory Bed ID:', formData.dormitoryBedId)

    try {
      const result = await updateStudent(params.id, {
        ...formData,
        guardians
      })
      
      console.log('Update result:', result)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'O\'quvchi ma\'lumotlari yangilandi',
        })
        router.push('/admin/students')
      } else {
        toast({
          title: 'Xato!',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">O'quvchini Tahrirlash</h2>
          <p className="text-muted-foreground">O'quvchi va qarindoshlari ma'lumotlarini yangilang</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              O'quvchi Ma'lumotlari
            </CardTitle>
            <CardDescription>
              O'quvchi haqida asosiy ma'lumotlar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">To'liq Ism *</Label>
                <Input
                  id="fullName"
                  placeholder="Masalan: Aliyev Vali Ahmedovich"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Email ixtiyoriy. Kelajakda o'quvchi login qilish uchun ishlatiladi
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentCode">O'quvchi Kodi *</Label>
                <Input
                  id="studentCode"
                  placeholder="STD240001"
                  value={formData.studentCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentCode: e.target.value }))}
                  required
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  O'quvchi kodi o'zgartirilmaydi
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Tug'ilgan Sana *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Jinsi *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'MALE' | 'FEMALE') =>
                    setFormData(prev => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">O'g'il bola</SelectItem>
                    <SelectItem value="FEMALE">Qiz bola</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Biriktirish turi</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="assignment-class"
                      name="assignmentType"
                      value="class"
                      checked={assignmentType === 'class'}
                      onChange={() => {
                        setAssignmentType('class')
                        setFormData(prev => ({ ...prev, groupId: '' }))
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="assignment-class" className="font-normal cursor-pointer">
                      Sinfga biriktirish
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="assignment-group"
                      name="assignmentType"
                      value="group"
                      checked={assignmentType === 'group'}
                      onChange={() => {
                        setAssignmentType('group')
                        setFormData(prev => ({ ...prev, classId: '' }))
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="assignment-group" className="font-normal cursor-pointer">
                      Guruhga biriktirish
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="assignment-none"
                      name="assignmentType"
                      value="none"
                      checked={assignmentType === 'none'}
                      onChange={() => {
                        setAssignmentType('none')
                        setFormData(prev => ({ ...prev, classId: '', groupId: '' }))
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="assignment-none" className="font-normal cursor-pointer">
                      Biriktirilmagan
                    </Label>
                  </div>
                </div>
              </div>

              {assignmentType === 'class' && (
                <div className="space-y-2">
                  <Label htmlFor="classId">Sinf *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sinfni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Sinflar topilmadi
                        </SelectItem>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({cls._count?.students || 0} o'quvchi)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {assignmentType === 'group' && (
                <div className="space-y-2">
                  <Label htmlFor="groupId">Guruh *</Label>
                  <Select
                    value={formData.groupId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Guruhni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Guruhlar topilmadi
                        </SelectItem>
                      ) : (
                        groups.map((grp: any) => (
                          <SelectItem key={grp.id} value={grp.id}>
                            {grp.name} {grp.code && `(${grp.code})`} - {grp._count?.students || 0} o'quvchi
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Textarea
                id="address"
                placeholder="Uy manzili"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Guardians Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Qarindoshlari Ma'lumotlari
                </CardTitle>
                <CardDescription>
                  O'quvchining ota-onasi yoki boshqa qarindoshlari haqida ma'lumot
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGuardian}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Qarindosh qo'shish
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {guardians.map((guardian, index) => (
              <div 
                key={index} 
                className="relative p-4 border rounded-lg space-y-4 bg-muted/30"
              >
                {guardians.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeGuardian(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">
                    Qarindosh #{index + 1}
                  </Badge>
                  {guardian.hasAccess && (
                    <Badge className="bg-green-100 text-green-800">
                      Nazoratchi
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-fullName`}>To'liq Ism *</Label>
                    <Input
                      id={`guardian-${index}-fullName`}
                      placeholder="Masalan: Aliyev Ahmed Valiovich"
                      value={guardian.fullName}
                      onChange={(e) => updateGuardian(index, 'fullName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-phone`}>Telefon Raqami *</Label>
                    <Input
                      id={`guardian-${index}-phone`}
                      placeholder="+998 90 123 45 67"
                      value={guardian.phone}
                      onChange={(e) => updateGuardian(index, 'phone', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-type`}>Qarindoshlik Turi *</Label>
                    <Select
                      value={guardian.guardianType}
                      onValueChange={(value) => updateGuardian(index, 'guardianType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FATHER">Otasi</SelectItem>
                        <SelectItem value="MOTHER">Onasi</SelectItem>
                        <SelectItem value="GUARDIAN">Vasiy</SelectItem>
                        <SelectItem value="OTHER">Boshqa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {guardian.guardianType === 'OTHER' && (
                    <div className="space-y-2">
                      <Label htmlFor={`guardian-${index}-custom`}>Qarindoshlik nomi *</Label>
                      <Input
                        id={`guardian-${index}-custom`}
                        placeholder="Masalan: Amaki, Xola"
                        value={guardian.customRelationship || ''}
                        onChange={(e) => updateGuardian(index, 'customRelationship', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-occupation`}>Kasbi</Label>
                    <Input
                      id={`guardian-${index}-occupation`}
                      placeholder="Masalan: O'qituvchi"
                      value={guardian.occupation || ''}
                      onChange={(e) => updateGuardian(index, 'occupation', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-workAddress`}>Ish joyi manzili</Label>
                    <Input
                      id={`guardian-${index}-workAddress`}
                      placeholder="Ish joyi manzili"
                      value={guardian.workAddress || ''}
                      onChange={(e) => updateGuardian(index, 'workAddress', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Radio className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`guardian-${index}-access`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Ushbu qarindoshga nazorat paneliga kirish huquqi berish
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Nazoratchi qarindosh o'quvchi baholari va davomatini ko'ra oladi
                    </p>
                  </div>
                  <Checkbox
                    id={`guardian-${index}-access`}
                    checked={guardian.hasAccess}
                    onCheckedChange={() => setGuardianAccess(index)}
                  />
                </div>
              </div>
            ))}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Diqqat:</strong> Faqat bitta qarindoshga nazorat paneliga kirish huquqi berilishi mumkin. 
                Bu qarindosh telefon raqami orqali tizimga kirib, o'quvchi ma'lumotlarini ko'ra oladi.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Moliyaviy Sozlamalar
            </CardTitle>
            <CardDescription>
              O'qish haqi va to'lov sanasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyTuitionFee">Oylik o'qish haqi (so'm)</Label>
                <Input
                  id="monthlyTuitionFee"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="1500000"
                  value={formData.monthlyTuitionFee}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    monthlyTuitionFee: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDueDay">To'lov muddati (oyning kuni)</Label>
                <Input
                  id="paymentDueDay"
                  type="number"
                  min="1"
                  max="28"
                  placeholder="5"
                  value={formData.paymentDueDay}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentDueDay: parseInt(e.target.value) || 5 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Har oyning qaysi sanasiga to'lov qilish kerak (1-28 oralig'ida)
                </p>
              </div>
            </div>

            {/* Trial Period */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trialEnabled"
                  checked={formData.trialEnabled}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, trialEnabled: checked as boolean }))
                  }
                />
                <Label htmlFor="trialEnabled" className="text-sm font-medium cursor-pointer">
                  Sinov muddati yoqish
                </Label>
              </div>

              {formData.trialEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="trialDays">Sinov muddati (kunlarda)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="1"
                    max="90"
                    placeholder="30"
                    value={formData.trialDays}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trialDays: parseInt(e.target.value) || 30 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sinov muddati davomida to'lov talab qilinmaydi
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dormitory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Yotoqxona
            </CardTitle>
            <CardDescription>
              O'quvchiga yotoqxona joy biriktirish
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsDormitory"
                checked={needsDormitory}
                onCheckedChange={(checked) => setNeedsDormitory(checked as boolean)}
              />
              <Label htmlFor="needsDormitory" className="text-sm font-medium cursor-pointer">
                O'quvchiga yotoqxona kerak
              </Label>
            </div>

            {needsDormitory && (
              <div className="space-y-4">
                {loadingRooms ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Hozircha bo'sh joylar yo'q. Avval yotoqxona xonalari va joylarni yarating.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Bo'sh joylar ({availableRooms.length} ta xona)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
                        {availableRooms.map((room) => (
                          <div
                            key={room.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                              selectedRoom?.id === room.id
                                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            onClick={() => {
                              setSelectedRoom(room)
                              setFormData(prev => ({
                                ...prev,
                                dormitoryMonthlyFee: Number(room.pricePerMonth),
                              }))
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
                              <span className="font-semibold">
                                {Number(room.pricePerMonth).toLocaleString()} so'm/oy
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
                                      className={`p-2 text-xs rounded border-2 transition-colors ${
                                        formData.dormitoryBedId === bed.id
                                          ? 'bg-indigo-500 text-white border-indigo-600'
                                          : 'bg-white border-gray-300 hover:border-indigo-400'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setFormData(prev => ({
                                          ...prev,
                                          dormitoryBedId: bed.id,
                                        }))
                                      }}
                                    >
                                      #{bed.bedNumber}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {formData.dormitoryBedId && selectedRoom && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Tanlangan:</strong> Xona {selectedRoom.roomNumber} - Joy #{selectedRoom.beds.find((b: any) => b.id === formData.dormitoryBedId)?.bedNumber}
                          • Oylik to'lov: {Number(selectedRoom.pricePerMonth).toLocaleString()} so'm
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/students">
            <Button type="button" variant="outline">
              Bekor qilish
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </div>
      </form>
    </div>
  )
}
