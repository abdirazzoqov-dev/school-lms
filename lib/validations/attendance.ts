import { z } from 'zod'

export const attendanceSchema = z.object({
  studentId: z.string().min(1, 'O\'quvchi tanlanishi shart'),
  classId: z.string().min(1, 'Sinf tanlanishi shart'),
  subjectId: z.string().min(1, 'Fan tanlanishi shart'),
  teacherId: z.string().min(1, 'O\'qituvchi tanlanishi shart'),
  date: z.string().min(1, 'Sana kiritilishi shart'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], {
    required_error: 'Status tanlanishi shart'
  }),
  notes: z.string().optional(),
})

export type AttendanceFormData = z.infer<typeof attendanceSchema>

export const bulkAttendanceSchema = z.object({
  classId: z.string().min(1, 'Sinf tanlanishi shart'),
  subjectId: z.string().min(1, 'Fan tanlanishi shart'),
  teacherId: z.string().min(1, 'O\'qituvchi tanlanishi shart'),
  date: z.string().min(1, 'Sana kiritilishi shart'),
  attendances: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  })),
  notes: z.string().optional(),
})

export type BulkAttendanceFormData = z.infer<typeof bulkAttendanceSchema>

