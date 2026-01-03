import { z } from 'zod'

export const announcementSchema = z.object({
  title: z.string().min(1, 'Sarlavha kiritilishi shart').max(200),
  content: z.string().min(1, 'Matn kiritilishi shart').max(10000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    required_error: 'Muhimlik darajasi tanlanishi shart'
  }),
  targetAudience: z.enum(['ALL', 'TEACHERS', 'PARENTS', 'STUDENTS'], {
    required_error: 'Kimga ko\'rsatish tanlanishi shart'
  }),
  expiresAt: z.string().optional(), // ISO date string
  isPinned: z.boolean().default(false),
})

export type AnnouncementFormData = z.infer<typeof announcementSchema>

export const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Past', color: 'gray' },
  { value: 'MEDIUM', label: 'O\'rta', color: 'blue' },
  { value: 'HIGH', label: 'Yuqori', color: 'orange' },
  { value: 'URGENT', label: 'Shoshilinch', color: 'red' },
] as const

export const TARGET_AUDIENCES = [
  { value: 'ALL', label: 'Hammaga' },
  { value: 'TEACHERS', label: 'O\'qituvchilarga' },
  { value: 'PARENTS', label: 'Ota-onalarga' },
  { value: 'STUDENTS', label: 'O\'quvchilarga' },
] as const

export function getPriorityColor(priority: string): string {
  const level = PRIORITY_LEVELS.find(p => p.value === priority)
  return level?.color || 'gray'
}

export function getPriorityLabel(priority: string): string {
  const level = PRIORITY_LEVELS.find(p => p.value === priority)
  return level?.label || priority
}

