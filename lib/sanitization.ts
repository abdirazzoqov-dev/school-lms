/**
 * ✅ SECURITY: Input Sanitization & Validation Utilities
 * Prevents XSS, SQL Injection, and other injection attacks
 */

/**
 * Sanitize HTML content to prevent XSS
 * Escapes dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize string for safe display
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove null bytes
  let cleaned = input.replace(/\0/g, '')
  
  // Trim whitespace
  cleaned = cleaned.trim()
  
  // Escape HTML
  cleaned = sanitizeHtml(cleaned)
  
  return cleaned
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null
  
  const trimmed = url.trim().toLowerCase()
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return null
    }
  }
  
  // Only allow http:, https:, mailto:, and relative URLs
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('mailto:') &&
    !trimmed.startsWith('/') &&
    !trimmed.startsWith('#')
  ) {
    return null
  }
  
  return url.trim()
}

/**
 * Sanitize phone number - only digits, +, -, (, ), spaces
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  return phone.replace(/[^\d\s\+\-\(\)]/g, '')
}

/**
 * Sanitize email - basic format check
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null
  
  const trimmed = email.trim().toLowerCase()
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any): number | null {
  const parsed = parseFloat(input)
  if (isNaN(parsed)) return null
  return parsed
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: any): number | null {
  const parsed = parseInt(input, 10)
  if (isNaN(parsed)) return null
  return parsed
}

/**
 * Remove script tags and dangerous HTML
 */
export function stripDangerousHtml(html: string): string {
  if (typeof html !== 'string') return ''
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove inline event handlers
    .replace(/on\w+='[^']*'/gi, '')
}

/**
 * Validate and sanitize file path
 * Prevents directory traversal attacks
 */
export function sanitizeFilePath(path: string): string | null {
  if (typeof path !== 'string') return null
  
  // Remove null bytes
  let cleaned = path.replace(/\0/g, '')
  
  // Check for directory traversal patterns
  if (
    cleaned.includes('..') ||
    cleaned.includes('~') ||
    cleaned.startsWith('/') ||
    cleaned.includes('\\')
  ) {
    return null
  }
  
  // Only allow alphanumeric, dash, underscore, and dot
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleaned)) {
    return null
  }
  
  return cleaned
}

/**
 * Sanitize JSON input
 * Ensures valid JSON and prevents injection
 */
export function sanitizeJson(input: string): any | null {
  if (typeof input !== 'string') return null
  
  try {
    const parsed = JSON.parse(input)
    // Re-stringify to ensure no malicious code
    return JSON.parse(JSON.stringify(parsed))
  } catch {
    return null
  }
}

/**
 * Sanitize search query
 * Prevents SQL injection and special character abuse
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return ''
  
  return query
    .trim()
    .replace(/[^\w\s\-\_\u0600-\u06FF\u0400-\u04FF]/g, '') // Allow letters, numbers, spaces, dash, underscore, Arabic, Cyrillic
    .substring(0, 100) // Limit length
}

/**
 * Validate and sanitize date string
 */
export function sanitizeDate(dateString: string): Date | null {
  if (typeof dateString !== 'string') return null
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  
  // Check for reasonable date range (1900-2100)
  if (date.getFullYear() < 1900 || date.getFullYear() > 2100) {
    return null
  }
  
  return date
}

/**
 * Sanitize object keys and values recursively
 * For database input sanitization
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const cleanKey = sanitizeString(key)
    
    // Sanitize value based on type
    if (value === null || value === undefined) {
      sanitized[cleanKey] = value
    } else if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeString(value)
    } else if (typeof value === 'number') {
      sanitized[cleanKey] = value
    } else if (typeof value === 'boolean') {
      sanitized[cleanKey] = value
    } else if (Array.isArray(value)) {
      sanitized[cleanKey] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) : sanitizeString(String(item))
      )
    } else if (typeof value === 'object') {
      sanitized[cleanKey] = sanitizeObject(value)
    } else {
      sanitized[cleanKey] = String(value)
    }
  }
  
  return sanitized as T
}

/**
 * Check if string contains suspicious patterns
 */
export function containsSuspiciousPattern(input: string): boolean {
  if (typeof input !== 'string') return false
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /\.\.\//g, // Directory traversal
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /exec\s*\(/i, // Code execution
    /eval\s*\(/i, // Code execution
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitize SQL LIKE pattern
 * Escapes special characters used in SQL LIKE
 */
export function sanitizeSqlLikePattern(pattern: string): string {
  if (typeof pattern !== 'string') return ''
  
  return pattern
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

