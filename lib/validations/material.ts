import { z } from 'zod'

export const materialSchema = z.object({
  title: z.string().min(1, 'Sarlavha kiritilishi shart').max(200),
  description: z.string().optional(),
  materialType: z.enum(['TEXTBOOK', 'ASSIGNMENT', 'DOCUMENT', 'VIDEO', 'PRESENTATION', 'OTHER'], {
    required_error: 'Material turi tanlanishi shart'
  }),
  subjectId: z.string().min(1, 'Fan tanlanishi shart'),
  classId: z.string().optional(),
  fileUrl: z.string().min(1, 'Fayl yuklanishi shart'),
  fileName: z.string().min(1),
  fileSize: z.number().min(1),
  fileType: z.string().min(1),
  isPublic: z.boolean().default(false),
})

export type MaterialFormData = z.infer<typeof materialSchema>

export const MATERIAL_TYPES = [
  { value: 'TEXTBOOK', label: 'Darslik' },
  { value: 'ASSIGNMENT', label: 'Topshiriq' },
  { value: 'DOCUMENT', label: 'Hujjat' },
  { value: 'VIDEO', label: 'Video dars' },
  { value: 'PRESENTATION', label: 'Taqdimot' },
  { value: 'OTHER', label: 'Boshqa' },
]

export const ALLOWED_FILE_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
  'text/plain': 'TXT',
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('video')) return '🎥'
  return '📎'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

