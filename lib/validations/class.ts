import { z } from 'zod'

export const classSchema = z.object({
  name: z.string().min(2, 'Sinf nomi kamida 2 ta belgi (masalan: 7-A)'),
  gradeLevel: z.number().min(1).max(11),
  classTeacherId: z.string().optional(),
  roomNumber: z.string().optional(),
  maxStudents: z.number().min(10).max(50).default(30),
})

export type ClassFormData = z.infer<typeof classSchema>

