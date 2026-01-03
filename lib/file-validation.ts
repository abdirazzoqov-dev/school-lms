// File Upload Xavfsizlik va Validatsiya

// Ruxsat etilgan file turlari
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  presentations: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
}

// Barcha ruxsat etilgan turlar
export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.spreadsheets,
  ...ALLOWED_FILE_TYPES.presentations,
]

// Maksimal file hajmlari (baytlarda)
export const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 10 * 1024 * 1024, // 10MB
}

// Xavfli file extensionlar (ASLO ruxsat etilmaydi!)
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
  '.pif', '.msi', '.dll', '.sh', '.app', '.dmg', '.pkg',
]

interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFilename?: string
}

/**
 * File nomini tozalash va xavfsiz qilish
 */
export function sanitizeFilename(filename: string): string {
  // Extension olish
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))

  // Xavfsiz nomga o'zgartirish
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '-') // Faqat harflar, raqamlar, _ va -
    .replace(/-+/g, '-') // Bir nechta - ni bittaga
    .substring(0, 50) // Max 50 ta belgi

  // Timestamp qo'shish (unique qilish uchun)
  const timestamp = Date.now()
  
  return `${sanitized}-${timestamp}${ext}`
}

/**
 * File turini tekshirish
 */
export function validateFileType(file: File, allowedTypes: string[]): FileValidationResult {
  // MIME type tekshirish
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File turi ruxsat etilmagan. Faqat: ${allowedTypes.join(', ')}`,
    }
  }

  // Extension tekshirish
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Xavfli file turi: ${ext}. Bu file yuklash mumkin emas.`,
    }
  }

  return { valid: true }
}

/**
 * File hajmini tekshirish
 */
export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE.default): FileValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File juda katta. Maksimal hajm: ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

/**
 * To'liq file validatsiya
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[]
    maxSize?: number
    requireImage?: boolean
  } = {}
): FileValidationResult {
  const {
    allowedTypes = ALL_ALLOWED_TYPES,
    maxSize = MAX_FILE_SIZE.default,
    requireImage = false,
  } = options

  // File turi tekshirish
  const typeValidation = validateFileType(file, allowedTypes)
  if (!typeValidation.valid) {
    return typeValidation
  }

  // File hajmi tekshirish
  const sizeValidation = validateFileSize(file, maxSize)
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  // Agar rasm kerak bo'lsa, tekshirish
  if (requireImage && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Faqat rasm fayllari ruxsat etilgan',
    }
  }

  // File nomini tozalash
  const sanitizedFilename = sanitizeFilename(file.name)

  return {
    valid: true,
    sanitizedFilename,
  }
}

/**
 * Image file uchun qo'shimcha validatsiya
 */
export async function validateImage(file: File): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    // Avval asosiy validatsiya
    const basicValidation = validateFile(file, {
      allowedTypes: ALLOWED_FILE_TYPES.images,
      maxSize: MAX_FILE_SIZE.image,
      requireImage: true,
    })

    if (!basicValidation.valid) {
      resolve(basicValidation)
      return
    }

    // Image o'lchamini tekshirish
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Juda katta yoki kichik rasmlarni rad etish
      if (img.width < 10 || img.height < 10) {
        resolve({
          valid: false,
          error: 'Rasm juda kichik (min: 10x10px)',
        })
        return
      }

      if (img.width > 10000 || img.height > 10000) {
        resolve({
          valid: false,
          error: 'Rasm juda katta (max: 10000x10000px)',
        })
        return
      }

      resolve({
        valid: true,
        sanitizedFilename: basicValidation.sanitizedFilename,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        valid: false,
        error: 'Rasm faylni yuklashda xatolik',
      })
    }

    img.src = url
  })
}

/**
 * Multiple files validatsiya
 */
export function validateFiles(
  files: File[],
  options: Parameters<typeof validateFile>[1] = {}
): { valid: boolean; errors: string[]; validFiles: File[] } {
  const errors: string[] = []
  const validFiles: File[] = []

  for (const file of files) {
    const validation = validateFile(file, options)
    if (validation.valid) {
      validFiles.push(file)
    } else {
      errors.push(`${file.name}: ${validation.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles,
  }
}

/**
 * File URL ni validatsiya qilish (external URLs uchun)
 */
export function isValidFileUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    // Faqat https ruxsat
    if (parsedUrl.protocol !== 'https:') {
      return false
    }
    // Xavfli domainlarni bloklash mumkin
    return true
  } catch {
    return false
  }
}

