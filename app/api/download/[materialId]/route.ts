import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const materialId = params.materialId

    // Get material from database
    const material = await db.material.findFirst({
      where: {
        id: materialId,
        tenantId: session.user.tenantId!
      }
    })

    if (!material) {
      return new NextResponse('Material not found', { status: 404 })
    }

    // Get file path
    const filePath = join(process.cwd(), 'public', material.fileUrl)

    try {
      // Read file
      const fileBuffer = await readFile(filePath)

      // Determine content type based on file extension
      const ext = material.fileUrl.split('.').pop()?.toLowerCase()
      const contentTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
      }

      const contentType = contentTypes[ext || ''] || 'application/octet-stream'

      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(material.title)}.${ext}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return new NextResponse('File not found on disk', { status: 404 })
    }
  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

