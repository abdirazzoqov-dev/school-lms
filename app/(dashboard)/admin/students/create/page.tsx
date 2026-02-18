'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createStudent } from '@/app/actions/student'
import { uploadAvatar } from '@/app/actions/upload-avatar'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, UserPlus, Loader2, Users, Home, Plus, X, Radio } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { GuardianFormData } from '@/lib/validations/student'
import { ProfilePhotoUpload } from '@/components/profile-photo-upload'

export default function CreateStudentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [avatarBase64, setAvatarBase64] = useState('')
  const [avatarFileName, setAvatarFileName] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [groups, setGroups] = useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [assignmentType, setAssignmentType] = useState<'class' | 'group' | 'none'>('class')
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
      hasAccess: true, // Birinchi qarindosh default nazoratchi
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
    // Trial period
    trialEnabled: false,
    trialDays: 30,
    // Dormitory fields
    dormitoryBedId: '',
    dormitoryMonthlyFee: 0,
    // Monthly tuition fee
    monthlyTuitionFee: 0,
    paymentDueDay: 5, // Default: har oydagi 5-kun
  })

  const generateStudentCode = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-code?type=student')
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // If session expired or tenant not found, suggest relogin
        if (errorData.needsRelogin || response.status === 401 || response.status === 404) {
          toast({
            title: 'Session muddati tugagan',
            description: 'Iltimos logout qiling va qaytadan login qiling.',
            variant: 'destructive',
            duration: 5000,
          })
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = '/api/auth/signout?callbackUrl=/login'
          }, 2000)
          return
        }
        
        throw new Error(errorData.error || 'Server xatosi')
      }
      
      const data = await response.json()
      
      if (data.success && data.code) {
        setFormData(prev => ({ ...prev, studentCode: data.code }))
        toast({
          title: 'Kod yaratildi',
          description: `O'quvchi kodi: ${data.code}`,
        })
      } else {
        throw new Error(data.error || 'Kod yaratishda xato')
      }
    } catch (error: any) {
      console.error('Generate student code error:', error)
      toast({
        title: 'Xato',
        description: error.message || 'Kod generatsiya qilishda xatolik',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    // Load classes and groups
    console.log('🔄 Loading classes and groups...')
    
    Promise.all([
      fetch('/api/admin/classes', {
        cache: 'no-store',
        credentials: 'include'
      }).then(res => res.json()),
      fetch('/api/admin/groups', {
        cache: 'no-store',
        credentials: 'include'
      }).then(res => res.json())
    ])
      .then(([classesData, groupsData]) => {
        console.log('📡 Classes API response:', classesData)
        console.log('📡 Groups API response:', groupsData)
        console.log('✅ Classes count:', (classesData.classes || []).length)
        console.log('✅ Groups count:', (groupsData.groups || []).length)
        
        setClasses(classesData.classes || [])
        setGroups(groupsData.groups || [])
        setLoadingClasses(false)
        setLoadingGroups(false)
        
        const totalOptions = (classesData.classes?.length || 0) + (groupsData.groups?.length || 0)
        if (totalOptions === 0) {
          toast({
            title: 'Diqqat!',
            description: 'Hozircha sinf yoki guruh mavjud emas. Avval yarating.',
            variant: 'destructive',
          })
        }
      })
      .catch((error) => {
        console.error('❌ Error loading classes/groups:', error)
        setLoadingClasses(false)
        setLoadingGroups(false)
        toast({
          title: 'Xato!',
          description: 'Ma\'lumotlarni yuklashda xatolik',
          variant: 'destructive',
        })
      })
    
    // Auto-generate student code
    generateStudentCode()
  }, [generateStudentCode, toast])

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
        title: 'Xato',
        description: 'Kamida 1 ta qarindosh bo\'lishi kerak',
        variant: 'destructive'
      })
      return
    }
    
    const removedHadAccess = guardians[index].hasAccess
    setGuardians(prev => {
      const newGuardians = prev.filter((_, i) => i !== index)
      // Agar o'chirilgan qarindosh nazoratchi bo'lsa, birinchisini nazoratchi qilish
      if (removedHadAccess && newGuardians.length > 0) {
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
    // Faqat bitta qarindosh hasAccess = true bo'lishi mumkin
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

    // Check if guardians with OTHER type have customRelationship
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

    // Check if monthly tuition fee is valid (can be 0 or more)
    if (formData.monthlyTuitionFee < 0) {
      toast({
        title: 'Xato',
        description: 'Oylik o\'qish to\'lov summasi 0 dan kichik bo\'lishi mumkin emas',
        variant: 'destructive'
      })
      return
    }

    // Check if trial enabled but trial days not provided
    if (formData.trialEnabled && (!formData.trialDays || formData.trialDays < 1)) {
      toast({
        title: 'Xato',
        description: 'Sinov muddati yoqilgan bo\'lsa, sinov davomiyligini kiriting (kamida 1 kun)',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const result = await createStudent({
        ...formData,
        guardians
      })

      if (result.success) {
        // Upload avatar if provided
        if (avatarBase64 && result.userId) {
          try {
            await uploadAvatar(result.userId, avatarBase64, avatarFileName || 'avatar.jpg')
          } catch (avatarError) {
            console.error('Avatar upload error:', avatarError)
            // Don't block success if avatar fails
          }
        }

        toast({
          title: 'Muvaffaqiyatli!',
          description: result.guardianCredentials 
            ? `O'quvchi qo'shildi. Qarindosh login: ${result.guardianCredentials.phone}`
            : 'O\'quvchi muvaffaqiyatli qo\'shildi',
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


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yangi O'quvchi</h2>
          <p className="text-muted-foreground">Yangi o'quvchi va qarindoshlari ma'lumotlarini kiriting</p>
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
            {/* Profile Photo */}
            <div className="flex justify-center py-2">
              <ProfilePhotoUpload
                name={formData.fullName}
                size={100}
                gradient="from-blue-500 to-indigo-600"
                onAvatarChange={(base64, fileName) => {
                  setAvatarBase64(base64)
                  setAvatarFileName(fileName)
                }}
              />
            </div>
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
                <Label htmlFor="studentCode">O'quvchi Kodi *</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentCode"
                    placeholder="STD240001"
                    value={formData.studentCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentCode: e.target.value }))}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateStudentCode}>
                    Generatsiya
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email (Ixtiyoriy)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com (bo'sh qoldirish mumkin)"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Agar bo'sh qoldirilsa, avtomatik email generatsiya qilinadi
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
                      Hozircha tayinlanmasin
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
                    <SelectTrigger disabled={loadingClasses}>
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
                    <SelectTrigger disabled={loadingGroups}>
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

        {/* Guardians Info - DYNAMIC */}
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
                {/* Remove button */}
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
                        <SelectItem value="FATHER">Ota</SelectItem>
                        <SelectItem value="MOTHER">Ona</SelectItem>
                        <SelectItem value="OTHER">Boshqa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {guardian.guardianType === 'OTHER' && (
                    <div className="space-y-2">
                      <Label htmlFor={`guardian-${index}-custom`}>Qarindoshlik (qo'lda) *</Label>
                      <Input
                        id={`guardian-${index}-custom`}
                        placeholder="Masalan: Amaki, Xola, Bobo"
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
                      placeholder="Kasbi (ixtiyoriy)"
                      value={guardian.occupation || ''}
                      onChange={(e) => updateGuardian(index, 'occupation', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-work`}>Ish joyi manzili</Label>
                    <Input
                      id={`guardian-${index}-work`}
                      placeholder="Ish joyi (ixtiyoriy)"
                      value={guardian.workAddress || ''}
                      onChange={(e) => updateGuardian(index, 'workAddress', e.target.value)}
                    />
                  </div>
                </div>

                {/* Access Control */}
                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`guardian-${index}-access`}
                      checked={guardian.hasAccess}
                      onCheckedChange={() => setGuardianAccess(index)}
                    />
                    <Label 
                      htmlFor={`guardian-${index}-access`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      Bu qarindoshga nazorat paneliga kirish huquqini berish
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Faqat bitta qarindosh nazorat paneliga kira oladi
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tuition Fee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              O'qish To'lovi
            </CardTitle>
            <CardDescription>
              O'quvchi to'lashi kerak bo'lgan oylik o'qish to'lov summasini kiriting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyTuitionFee">
                Oylik O'qish To'lov Summasi (so'm) *
              </Label>
              <Input
                id="monthlyTuitionFee"
                type="number"
                inputMode="numeric"
                min="0"
                max="200000000"
                step="1"
                placeholder="Masalan: 500000 (0 dan 200,000,000 gacha)"
                value={formData.monthlyTuitionFee || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  monthlyTuitionFee: parseFloat(e.target.value) || 0 
                }))}
                required
              />
              {formData.monthlyTuitionFee >= 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.monthlyTuitionFee === 0 
                    ? 'Bepul o\'qish' 
                    : `${formData.monthlyTuitionFee.toLocaleString('uz-UZ')} so'm/oy`}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                0 so'm (bepul) dan 200,000,000 so'm va undan yuqori summa kiritish mumkin
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDueDay">
                To'lov Muddati (Har oyning qaysi sanasida) *
              </Label>
              <Select
                value={formData.paymentDueDay.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentDueDay: parseInt(value) }))}
              >
                <SelectTrigger id="paymentDueDay">
                  <SelectValue placeholder="Sanani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Har oyning {day}-sanasida
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O'quvchi har oyning shu sanasigacha to'lovni amalga oshirishi kerak (1-28 kun)
              </p>
            </div>
            {formData.monthlyTuitionFee === 0 ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  🎓 Bepul o'qish - To'lov talab qilinmaydi
                </p>
              </div>
            ) : formData.trialEnabled ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Sinov muddati tugagach ({formData.trialDays} kun), birinchi oylik to'lov ({formData.monthlyTuitionFee.toLocaleString('uz-UZ')} so'm) boshlanadi
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✓ Oylik to'lov ({formData.monthlyTuitionFee.toLocaleString('uz-UZ')} so'm) birdan boshlanadi
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trial Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Sinov Muddati
            </CardTitle>
            <CardDescription>
              O'quvchi platformadan sinov rejimida foydalansin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trialEnabled"
                checked={formData.trialEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trialEnabled: checked as boolean }))}
              />
              <Label 
                htmlFor="trialEnabled"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Sinov muddatini yoqish
              </Label>
            </div>

            {formData.trialEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="trialDays">
                    Sinov davomiyligi (kunlarda) *
                  </Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="1"
                    value={formData.trialDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 30 }))}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ro'yxatdan o'tgan sanadan boshlab {formData.trialDays} kun sinov muddati
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Sinov muddati tugagach, o'quvchi profili avtomatik nofaol holatga o'tadi va admin panel dashboard'da xabarnoma ko'rsatiladi
                  </p>
                  {formData.monthlyTuitionFee > 0 && (
                    <p className="text-sm text-yellow-800 mt-2">
                      💰 Sinov muddati tugagach ({formData.trialDays} kun), birinchi oylik to'lov ({formData.monthlyTuitionFee.toLocaleString('uz-UZ')} so'm) avtomatik yaratiladi
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dormitory Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Yotoqxona
            </CardTitle>
            <CardDescription>
              O'quvchi yotoqxonada turadimi?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsDormitory"
                checked={needsDormitory}
                onCheckedChange={(checked) => setNeedsDormitory(checked as boolean)}
              />
              <Label 
                htmlFor="needsDormitory"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                O'quvchi yotoqxonada turadi
              </Label>
            </div>

            {needsDormitory && (
              <div className="space-y-4 pt-4 border-t">
                {loadingRooms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="ml-2 text-muted-foreground">Bo'sh xonalar yuklanmoqda...</p>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-muted/50">
                    <Home className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {formData.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'} uchun bo'sh xonalar yo'q
                    </p>
                    <Link href="/admin/dormitory/rooms/create" target="_blank">
                      <Button variant="link" size="sm" className="mt-2">
                        Yangi xona yaratish
                      </Button>
                    </Link>
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

                    {formData.dormitoryBedId && (
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-sm font-medium text-indigo-900">
                          ✓ Tanlandi: Xona {selectedRoom?.roomNumber}, Joy #{selectedRoom?.beds.find((b: any) => b.id === formData.dormitoryBedId)?.bedNumber}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">
                          Oylik to'lov: {formData.dormitoryMonthlyFee.toLocaleString()} so'm
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">📝 Eslatma</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Kamida 1 ta qarindosh ma'lumotini kiriting
          </p>
          <p>
            • Faqat bitta qarindoshga nazorat paneliga kirish huquqi bering
          </p>
          <p>
            • Nazoratchi qarindosh login qilish uchun: <strong>Telefon raqam</strong> va default parol: <code className="bg-white px-2 py-1 rounded">Parent123!</code>
          </p>
          <p>
            • Qarindoshlik turida "Boshqa" tanlansa, qo'lda yozing (masalan: Amaki, Xola, Bobo)
          </p>
          <p>
            • O'quvchi kodi har bir maktabda unique bo'lishi kerak
          </p>
          <p>
            • Oylik o'qish to'lov summasini majburiy kiriting
          </p>
          <p>
            • Agar sinov muddati yoqilgan bo'lsa, sinov muddati tugagach birinchi oylik to'lov boshlanadi
          </p>
          <p>
            • Agar sinov muddati yo'q bo'lsa, oylik to'lov birdan boshlanadi
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
