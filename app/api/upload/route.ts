import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateFile, MAX_FILE_SIZE } from '@/lib/file-validation'
import { withRateLimit } from '@/lib/rate-limit'
import { uploadFile, isStorageConfigured } from '@/lib/storage'
import { handleApiError } from '@/lib/api-error-handler'

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Tizimga kirish talab qilinadi' },
          { status: 401 }
        )
      }

      // ✅ SECURITY: Check if storage is properly configured
      if (!isStorageConfigured()) {
        console.error('Storage not configured properly!')
        return NextResponse.json(
          { error: 'Configuration error', message: 'File storage sozlanmagan' },
          { status: 503 }
        )
      }

      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded', message: 'Fayl tanlanmagan' },
          { status: 400 }
        )
      }

      // ✅ SECURITY: File validatsiya
      const validation = validateFile(file, {
        maxSize: MAX_FILE_SIZE.document, // 10MB
      })

      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', message: validation.error },
          { status: 400 }
        )
      }

      // ✅ SECURITY: Sanitized filename
      const filename = validation.sanitizedFilename!

      // ✅ PRODUCTION-READY: Upload to configured storage
      const uploadResult = await uploadFile(file, filename)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Return file info
      return NextResponse.json({
        success: true,
        file: {
          url: uploadResult.url,
          name: file.name,
          size: file.size,
          type: file.type,
          key: uploadResult.key,
        }
      })
    } catch (error) {
      return handleApiError(error, {
        userId: (await getServerSession(authOptions))?.user?.id,
        action: 'FILE_UPLOAD',
        path: request.nextUrl.pathname,
      })
    }
  })
}

