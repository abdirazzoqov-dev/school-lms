import { z } from 'zod'

export const messageSchema = z.object({
  recipientId: z.string().min(1, 'Qabul qiluvchi tanlanishi shart'),
  studentId: z.string().optional(), // Which student the message is about (for context)
  subject: z.string().max(200).optional(),
  content: z.string().min(1, 'Xabar matni kiritilishi shart').max(5000),
})

export const messageReplySchema = z.object({
  content: z.string().min(1, 'Javob matni kiritilishi shart').max(5000),
})

export type MessageFormData = z.infer<typeof messageSchema>
export type MessageReplyData = z.infer<typeof messageReplySchema>

export const MESSAGE_STATUS = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  ARCHIVED: 'ARCHIVED',
} as const

export type MessageStatus = keyof typeof MESSAGE_STATUS

