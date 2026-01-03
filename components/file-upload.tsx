'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, File, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize, getFileIcon } from '@/lib/validations/material'

interface FileUploadProps {
  onUpload: (file: { url: string; name: string; size: number; type: string }) => void
  maxSize?: number
  accept?: string
  className?: string
}

export function FileUpload({ 
  onUpload, 
  maxSize = 50 * 1024 * 1024, 
  accept,
  className = '' 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`Fayl hajmi ${formatFileSize(maxSize)} dan oshmasligi kerak`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadedFile(result.file)
        onUpload(result.file)
        toast.success('Fayl yuklandi')
      } else {
        toast.error(result.error || 'Yuklashda xatolik')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Yuklashda xatolik')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={isUploading}
      />

      {!uploadedFile ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Faylni tanlash uchun bosing yoki bu yerga tashlang
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Fayl tanlash
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Maksimal hajm: {formatFileSize(maxSize)}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {getFileIcon(uploadedFile.type)}
              </div>
              <div>
                <p className="font-medium text-sm">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

