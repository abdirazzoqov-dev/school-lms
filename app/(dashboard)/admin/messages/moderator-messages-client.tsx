'use client'

import { MessagesClient } from '@/app/(dashboard)/teacher/messages/messages-client'

interface Message {
  id: string
  subject: string | null
  content: string
  createdAt: Date | string
  readAt: Date | string | null
  sender: { id: string; fullName: string; role?: string }
  receiver: { id: string; fullName: string; role?: string }
  student?: {
    id: string
    studentCode: string
    user: { fullName: string } | null
    class: { name: string } | null
  } | null
}

interface ModeratorMessagesClientProps {
  receivedMessages: Message[]
  sentMessages: Message[]
  currentUserId: string
}

export function ModeratorMessagesClient({
  receivedMessages,
  sentMessages,
  currentUserId,
}: ModeratorMessagesClientProps) {
  return (
    <MessagesClient
      receivedMessages={receivedMessages}
      sentMessages={sentMessages}
      currentUserId={currentUserId}
      composePath="/admin/messages/compose"
    />
  )
}
