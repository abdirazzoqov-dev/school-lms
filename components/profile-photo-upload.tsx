'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, X, Upload } from 'lucide-react'
import { uploadAvatar } from '@/app/actions/upload-avatar'
import { toast } from 'sonner'

interface ProfilePhotoUploadProps {
  userId?: string        // if provided, auto-uploads on select (edit mode)
  currentAvatar?: string | null
  name?: string
  size?: number          // diameter in px, default 96
  onAvatarChange?: (base64: string, fileName: string) => void  // for create mode (manual upload)
  onUploadSuccess?: (avatarUrl: string) => void
  gradient?: string
}

// Client-side image compression using canvas
async function compressImage(file: File, maxSize = 400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Maintain aspect ratio, limit to maxSize
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ProfilePhotoUpload({
  userId,
  currentAvatar,
  name = '',
  size = 96,
  onAvatarChange,
  onUploadSuccess,
  gradient = 'from-violet-500 to-purple-600',
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllari qabul qilinadi')
      return
    }

    // Validate size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Rasm hajmi 10MB dan oshmasligi kerak')
      return
    }

    try {
      setUploading(true)

      // Compress image client-side
      const compressed = await compressImage(file)
      setPreview(compressed)

      if (userId) {
        // Edit mode: auto-upload
        const result = await uploadAvatar(userId, compressed, file.name)
        if (result.success && result.avatarUrl) {
          toast.success('Rasm muvaffaqiyatli saqlandi')
          onUploadSuccess?.(result.avatarUrl)
        } else {
          toast.error(result.error || 'Rasmni saqlashda xato')
          setPreview(currentAvatar || null)
        }
      } else {
        // Create mode: pass to parent for later upload
        onAvatarChange?.(compressed, file.name)
      }
    } catch (err) {
      toast.error('Rasmni qayta ishlashda xato')
      setPreview(currentAvatar || null)
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [userId, currentAvatar, onAvatarChange, onUploadSuccess])

  const handleRemove = useCallback(async () => {
    setPreview(null)
    onAvatarChange?.('', '')
  }, [onAvatarChange])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative group" style={{ width: size, height: size }}>
        <div
          className="rounded-full overflow-hidden border-4 border-white shadow-xl"
          style={{ width: size, height: size }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={name || 'Avatar'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}
              style={{ fontSize: size * 0.32 }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Upload overlay on hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          aria-label="Rasm yuklash"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>

        {/* Remove button */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-colors"
            aria-label="Rasmni o'chirish"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Loading indicator badge */}
        {uploading && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white rounded-full px-2 py-0.5 shadow text-[10px] font-medium text-gray-600 whitespace-nowrap">
            Saqlanmoqda...
          </div>
        )}
      </div>

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-1.5 text-xs"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {preview ? 'Rasmni almashtirish' : 'Rasm yuklash'}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">
        JPG, PNG yoki WebP. Maks 10MB
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

