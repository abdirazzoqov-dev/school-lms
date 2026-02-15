'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createContract } from '@/app/actions/contract'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, Loader2 } from 'lucide-react'

interface ContractFormProps {
  teachers: Array<{
    id: string
    teacherCode: string
    user: {
      fullName: string
    }
  }>
  staff: Array<{
    id: string
    staffCode: string
    user: {
      fullName: string
    }
  }>
  parents: Array<{
    id: string
    user: {
      fullName: string
    }
  }>
}

export function ContractForm({ teachers, staff, parents }: ContractFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    forTeachers: false,
    forStaff: false,
    forParents: false,
    teacherId: '',
    staffId: '',
    parentId: '',
    fileData: '',
    fileName: '',
    fileType: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Xato!',
        description: 'Faqat PDF, Word yoki Excel fayllar qabul qilinadi',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Xato!',
        description: 'Fayl hajmi 10MB dan oshmasligi kerak',
        variant: 'destructive',
      })
      return
    }

    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Convert to Base64
    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        fileData: reader.result as string,
        fileName: file.name,
        fileType: file.type,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast({
        title: 'Xato!',
        description: 'Sarlavhani kiriting',
        variant: 'destructive',
      })
      return
    }

    if (!formData.fileData) {
      toast({
        title: 'Xato!',
        description: 'Faylni yuklang',
        variant: 'destructive',
      })
      return
    }

    if (!formData.forTeachers && !formData.forStaff && !formData.forParents) {
      toast({
        title: 'Xato!',
        description: 'Kamida bitta qabul qiluvchi turini tanlang',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    const result = await createContract(formData)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Shartnoma yuklandi',
      })
      router.push('/admin/contracts')
    } else {
      toast({
        title: 'Xato!',
        description: result.error,
        variant: 'destructive',
      })
    }

    setIsSubmitting(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shartnoma Ma'lumotlari</CardTitle>
          <CardDescription>
            Shartnoma haqida asosiy ma'lumotlarni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Sarlavha *</Label>
            <Input
              id="title"
              placeholder="Mehnat shartnomasi"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              placeholder="Shartnoma haqida qo'shimcha ma'lumot..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fayl Yuklash *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {fileInfo ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="font-medium">{fileInfo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileInfo.size)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFileInfo(null)
                      setFormData({ ...formData, fileData: '', fileName: '', fileType: '' })
                    }}
                  >
                    O'zgartirish
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-2">
                    Faylni yuklash uchun bosing
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PDF, Word yoki Excel (Maksimal: 10MB)
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qabul Qiluvchilar</CardTitle>
          <CardDescription>
            Shartnomani kim ko'rishi kerakligini belgilang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="forTeachers"
              checked={formData.forTeachers}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, forTeachers: checked as boolean })
              }
            />
            <Label htmlFor="forTeachers" className="font-medium cursor-pointer">
              Barcha O'qituvchilar
            </Label>
          </div>

          {formData.forTeachers && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="teacherId">Maxsus O'qituvchi (ixtiyoriy)</Label>
              <Select
                value={formData.teacherId || undefined}
                onValueChange={(value) => setFormData({ ...formData, teacherId: value === 'all' ? '' : value })}
              >
                <SelectTrigger id="teacherId">
                  <SelectValue placeholder="Barcha o'qituvchilar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha o'qituvchilar</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user.fullName} ({teacher.teacherCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="forStaff"
              checked={formData.forStaff}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, forStaff: checked as boolean })
              }
            />
            <Label htmlFor="forStaff" className="font-medium cursor-pointer">
              Barcha Xodimlar
            </Label>
          </div>

          {formData.forStaff && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="staffId">Maxsus Xodim (ixtiyoriy)</Label>
              <Select
                value={formData.staffId || undefined}
                onValueChange={(value) => setFormData({ ...formData, staffId: value === 'all' ? '' : value })}
              >
                <SelectTrigger id="staffId">
                  <SelectValue placeholder="Barcha xodimlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha xodimlar</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user.fullName} ({s.staffCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="forParents"
              checked={formData.forParents}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, forParents: checked as boolean })
              }
            />
            <Label htmlFor="forParents" className="font-medium cursor-pointer">
              Barcha Ota-onalar
            </Label>
          </div>

          {formData.forParents && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="parentId">Maxsus Ota-ona (ixtiyoriy)</Label>
              <Select
                value={formData.parentId || undefined}
                onValueChange={(value) => setFormData({ ...formData, parentId: value === 'all' ? '' : value })}
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Barcha ota-onalar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha ota-onalar</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yuklanmoqda...
            </>
          ) : (
            'Yuklash'
          )}
        </Button>
      </div>
    </form>
  )
}

