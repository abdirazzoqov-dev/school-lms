import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateFile, MAX_FILE_SIZE } from '@/lib/file-validation'
import { withRateLimit } from '@/lib/rate-limit'

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

      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded', message: 'Fayl tanlanmagan' },
          { status: 400 }
        )
      }

      // ✅ Xavfsizlik: File validatsiya
      const validation = validateFile(file, {
        maxSize: MAX_FILE_SIZE.document, // 10MB
      })

      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', message: validation.error },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // ✅ Xavfsizlik: Sanitized filename
      const filename = validation.sanitizedFilename!
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

      // Return file info
      return NextResponse.json({
        success: true,
        file: {
          url: `/uploads/${filename}`,
          name: file.name,
          size: file.size,
          type: file.type,
        }
      })
    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: 'Upload failed', message: 'Fayl yuklashda xatolik' },
        { status: 500 }
      )
    }
  })
}

