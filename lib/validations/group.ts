import { z } from 'zod'

export const groupSchema = z.object({
  name: z.string().min(2, 'Guruh nomi kamida 2 ta belgi (masalan: Ingliz A2+)'),
  description: z.string().optional(),
  code: z.string().optional(),
  groupTeacherId: z.string().optional(),
  roomNumber: z.string().optional(),
  maxStudents: z.number().min(5).max(50).default(20),
})

export type GroupFormData = z.infer<typeof groupSchema>

