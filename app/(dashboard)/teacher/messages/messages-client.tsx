'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageList } from '@/components/message-list'
import { toast } from 'sonner'
import { deleteMessage, markMessageAsRead } from '@/app/actions/message'

interface MessagesClientProps {
  receivedMessages: any[]
  sentMessages: any[]
  currentUserId: string
}

export function MessagesClient({ receivedMessages, sentMessages, currentUserId }: MessagesClientProps) {
  const router = useRouter()

  const handleDelete = async (messageId: string) => {
    if (!confirm('Xabarni o\'chirmoqchimisiz?')) return

    const result = await deleteMessage(messageId)
    if (result.success) {
      toast.success('Xabar o\'chirildi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  const handleReply = async (messageId: string) => {
    // Mark as read when replying
    await markMessageAsRead(messageId)
    router.push(`/teacher/messages/compose?replyTo=${messageId}`)
  }

  return (
    <Tabs defaultValue="received" className="space-y-4">
      <TabsList>
        <TabsTrigger value="received">
          Qabul qilingan ({receivedMessages.length})
        </TabsTrigger>
        <TabsTrigger value="sent">
          Yuborilgan ({sentMessages.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="space-y-4">
        <MessageList
          messages={receivedMessages}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      </TabsContent>

      <TabsContent value="sent" className="space-y-4">
        <MessageList
          messages={sentMessages}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      </TabsContent>
    </Tabs>
  )
}

