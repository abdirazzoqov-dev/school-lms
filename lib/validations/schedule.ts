import { z } from 'zod'

export const scheduleSchema = z.object({
  classId: z.string().min(1, 'Sinf tanlanishi shart'),
  subjectId: z.string().min(1, 'Fan tanlanishi shart'),
  teacherId: z.string().min(1, 'O\'qituvchi tanlanishi shart'),
  dayOfWeek: z.number().min(1).max(7, 'Hafta kuni 1-7 orasida bo\'lishi kerak'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Vaqt formati: HH:MM'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Vaqt formati: HH:MM'),
  roomNumber: z.string().optional(),
  academicYear: z.string().min(1, 'O\'quv yili kiritilishi shart'),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>

// Validation helper to check time conflicts
export function checkTimeConflict(
  schedule1: { startTime: string; endTime: string },
  schedule2: { startTime: string; endTime: string }
): boolean {
  const start1 = timeToMinutes(schedule1.startTime)
  const end1 = timeToMinutes(schedule1.endTime)
  const start2 = timeToMinutes(schedule2.startTime)
  const end2 = timeToMinutes(schedule2.endTime)

  // Check if times overlap
  return (start1 < end2 && end1 > start2)
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
  { value: 7, label: 'Yakshanba' },
]

export const TIME_SLOTS = [
  { value: '08:00', label: '08:00' },
  { value: '08:45', label: '08:45' },
  { value: '09:30', label: '09:30' },
  { value: '10:15', label: '10:15' },
  { value: '11:00', label: '11:00' },
  { value: '11:45', label: '11:45' },
  { value: '12:30', label: '12:30' },
  { value: '13:15', label: '13:15' },
  { value: '14:00', label: '14:00' },
  { value: '14:45', label: '14:45' },
  { value: '15:30', label: '15:30' },
  { value: '16:15', label: '16:15' },
  { value: '17:00', label: '17:00' },
]

