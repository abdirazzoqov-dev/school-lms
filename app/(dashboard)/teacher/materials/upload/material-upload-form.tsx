'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createMaterial } from '@/app/actions/material'
import { Loader2 } from 'lucide-react'
import { MATERIAL_TYPES } from '@/lib/validations/material'
import { FileUpload } from '@/components/file-upload'
import Link from 'next/link'

interface MaterialUploadFormProps {
  subjects: Array<{ id: string; name: string }>
  classes: Array<{ id: string; name: string }>
}

export function MaterialUploadForm({ subjects, classes }: MaterialUploadFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materialType: 'DOCUMENT' as any,
    subjectId: '',
    classId: '',
    isPublic: false,
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    fileType: '',
  })

  const handleFileUpload = (file: { url: string; name: string; size: number; type: string }) => {
    setFormData({
      ...formData,
      fileUrl: file.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fileUrl) {
      toast.error('Iltimos fayl yuklang')
      return
    }

    setIsLoading(true)

    try {
      const result = await createMaterial(formData)

      if (result.success) {
        toast.success('Material yuklandi')
        router.push('/teacher/materials')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <div>
        <Label>Fayl *</Label>
        <FileUpload
          onUpload={handleFileUpload}
          className="mt-2"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title">Sarlavha *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Masalan: Matematika 10-sinf darslik"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Material haqida qisqacha ma'lumot"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="materialType">Material turi *</Label>
          <Select
            value={formData.materialType}
            onValueChange={(value: any) => setFormData({ ...formData, materialType: value })}
            required
          >
            <SelectTrigger id="materialType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subjectId">Fan *</Label>
          <Select
            value={formData.subjectId}
            onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
            required
          >
            <SelectTrigger id="subjectId">
              <SelectValue placeholder="Fan tanlang" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="classId">Sinf (ixtiyoriy)</Label>
          <Select
            value={formData.classId || "all"}
            onValueChange={(value) => setFormData({ ...formData, classId: value === "all" ? "" : value })}
          >
            <SelectTrigger id="classId">
              <SelectValue placeholder="Sinf tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha sinflar</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          checked={formData.isPublic}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, isPublic: checked as boolean })
          }
        />
        <Label 
          htmlFor="isPublic" 
          className="text-sm font-normal cursor-pointer"
        >
          Umumiy kutubxonada ko'rsatish (boshqa o'qituvchilar ham ko'ra oladi)
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/teacher/materials">
          <Button type="button" variant="outline">
            Bekor qilish
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading || !formData.fileUrl}>
          {isLoading ? (
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

