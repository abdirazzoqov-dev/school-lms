import { z } from 'zod'

export const gradeSchema = z.object({
  studentId: z.string().min(1, 'O\'quvchi tanlanishi shart'),
  subjectId: z.string().min(1, 'Fan tanlanishi shart'),
  gradeType: z.enum(['ORAL', 'WRITTEN', 'TEST', 'EXAM', 'QUARTER', 'FINAL'], {
    required_error: 'Baho turi tanlanishi shart'
  }),
  score: z.number().min(0, 'Ball 0 dan kichik bo\'lmasligi kerak'),
  maxScore: z.number().min(1, 'Maksimal ball 1 dan kichik bo\'lmasligi kerak'),
  quarter: z.number().min(1).max(4).optional(),
  academicYear: z.string().min(1, 'O\'quv yili kiritilishi shart'),
  date: z.string().min(1, 'Sana kiritilishi shart'),
  notes: z.string().optional(),
})

export type GradeFormData = z.infer<typeof gradeSchema>

export const bulkGradeSchema = z.object({
  classId: z.string().min(1, 'Sinf tanlanishi shart'),
  subjectId: z.string().min(1, 'Fan tanlanishi shart'),
  gradeType: z.enum(['ORAL', 'WRITTEN', 'TEST', 'EXAM', 'QUARTER', 'FINAL']),
  maxScore: z.number().min(1),
  quarter: z.number().min(1).max(4).optional(),
  academicYear: z.string().min(1, 'O\'quv yili kiritilishi shart'),
  date: z.string().min(1),
  grades: z.array(z.object({
    studentId: z.string(),
    score: z.number().min(0),
  })),
  notes: z.string().optional(),
})

export type BulkGradeFormData = z.infer<typeof bulkGradeSchema>

