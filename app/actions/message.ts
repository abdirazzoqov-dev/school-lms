'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { messageSchema, MessageFormData, messageReplySchema, MessageReplyData } from '@/lib/validations/message'
import { revalidatePath } from 'next/cache'
import { getUserPermissions } from '@/lib/permissions'

export async function sendMessage(data: MessageFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['TEACHER', 'PARENT', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // MODERATOR permission check
    if (session.user.role === 'MODERATOR') {
      const perms = await getUserPermissions(session.user.id, session.user.tenantId!)
      if (!perms.messages?.includes('CREATE') && !perms.messages?.includes('ALL')) {
        return { success: false, error: 'Xabar yuborish uchun ruxsat yo\'q' }
      }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = messageSchema.parse(data)

    // Verify recipient exists in same tenant
    const recipient = await db.user.findFirst({
      where: { 
        id: validatedData.recipientId,
        tenantId 
      }
    })

    if (!recipient) {
      return { success: false, error: 'Qabul qiluvchi topilmadi' }
    }

    // Create message
    const message = await db.message.create({
      data: {
        tenantId,
        senderId: session.user.id,
        receiverId: validatedData.recipientId,
        studentId: validatedData.studentId || null, // Optional: for context about which student
        subject: validatedData.subject,
        content: validatedData.content,
        status: 'SENT',
      }
    })

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')
    revalidatePath('/admin/messages')
    
    return { success: true, message }
  } catch (error: any) {
    console.error('Send message error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function replyToMessage(messageId: string, data: MessageReplyData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = messageReplySchema.parse(data)

    // Get original message
    const originalMessage = await db.message.findFirst({
      where: { 
        id: messageId,
        tenantId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    })

    if (!originalMessage) {
      return { success: false, error: 'Xabar topilmadi' }
    }

    // Determine recipient (reply to sender if we're recipient, or to recipient if we're sender)
    const receiverId = originalMessage.receiverId === session.user.id 
      ? originalMessage.senderId 
      : originalMessage.receiverId

    // Create reply message
    const reply = await db.message.create({
      data: {
        tenantId,
        senderId: session.user.id,
        receiverId: receiverId,
        subject: originalMessage.subject ? `Re: ${originalMessage.subject}` : null,
        content: validatedData.content,
        parentMessageId: messageId,
        status: 'SENT',
      }
    })

    // Mark original as read
    if (originalMessage.receiverId === session.user.id) {
      await db.message.update({
        where: { id: messageId },
        data: { readAt: new Date() }
      })
    }

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')
    revalidatePath('/admin/messages')
    
    return { success: true, reply }
  } catch (error: any) {
    console.error('Reply message error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if user is recipient
    const message = await db.message.findFirst({
      where: { 
        id: messageId,
        tenantId,
        receiverId: session.user.id 
      }
    })

    if (!message) {
      return { success: false, error: 'Xabar topilmadi' }
    }

    // Mark as read
    await db.message.update({
      where: { id: messageId },
      data: { 
        readAt: new Date()
      }
    })

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')
    revalidatePath('/admin/messages')
    
    return { success: true }
  } catch (error: any) {
    console.error('Mark as read error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

/**
 * Soft-delete a message.
 * - deleteForEveryone: false → mark deleted only for the current user
 * - deleteForEveryone: true  → mark deleted for both sender and receiver
 * Admin panel always sees all messages regardless of deletion flags.
 */
export async function deleteMessage(messageId: string, deleteForEveryone = false) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const userId = session.user.id

    // Find the message and verify the caller is a participant
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        tenantId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    })

    if (!message) {
      return { success: false, error: 'Xabar topilmadi' }
    }

    const isSender   = message.senderId   === userId
    const isReceiver = message.receiverId === userId

    if (deleteForEveryone) {
      // Mark deleted for both sides
      await db.message.update({
        where: { id: messageId },
        data: { deletedBySender: true, deletedByReceiver: true },
      })
    } else {
      // Mark deleted only for this user
      await db.message.update({
        where: { id: messageId },
        data: {
          ...(isSender   ? { deletedBySender:   true } : {}),
          ...(isReceiver ? { deletedByReceiver: true } : {}),
        },
      })
    }

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')

    return { success: true }
  } catch (error: any) {
    console.error('Delete message error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

/**
 * Soft-delete ALL messages in a conversation (with a partner) for the current user.
 */
export async function deleteConversation(partnerId: string, deleteForEveryone = false) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const userId = session.user.id

    if (deleteForEveryone) {
      // Only mark YOUR OWN sent messages as deleted for both sides
      // (receiver cannot delete sender's messages from sender's inbox)
      await db.message.updateMany({
        where: { tenantId, senderId: userId, receiverId: partnerId },
        data: { deletedBySender: true, deletedByReceiver: true },
      })
      // Received messages: only delete from your side (deletedByReceiver)
      await db.message.updateMany({
        where: { tenantId, senderId: partnerId, receiverId: userId },
        data: { deletedByReceiver: true },
      })
    } else {
      // Sent messages — mark deletedBySender
      await db.message.updateMany({
        where: { tenantId, senderId: userId, receiverId: partnerId },
        data: { deletedBySender: true },
      })
      // Received messages — mark deletedByReceiver
      await db.message.updateMany({
        where: { tenantId, senderId: partnerId, receiverId: userId },
        data: { deletedByReceiver: true },
      })
    }

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')

    return { success: true }
  } catch (error: any) {
    console.error('Delete conversation error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

/**
 * Edit a message's content. Only the original sender can edit their own message.
 */
export async function editMessage(messageId: string, newContent: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const userId = session.user.id

    if (!newContent.trim()) {
      return { success: false, error: 'Xabar matni bo\'sh bo\'lishi mumkin emas' }
    }

    // Only sender can edit their own message
    const message = await db.message.findFirst({
      where: { id: messageId, tenantId, senderId: userId },
    })

    if (!message) {
      return { success: false, error: 'Xabar topilmadi yoki tahrirlash huquqi yo\'q' }
    }

    await db.message.update({
      where: { id: messageId },
      data: { content: newContent.trim() },
    })

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')
    revalidatePath('/admin/messages')

    return { success: true }
  } catch (error: any) {
    console.error('Edit message error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function getUnreadCount() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const count = await db.message.count({
      where: {
        tenantId,
        receiverId: session.user.id,
        readAt: null
      }
    })

    return { success: true, count }
  } catch (error: any) {
    console.error('Get unread count error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

/**
 * Mark ALL unread received messages as read for the current user at once.
 * Called when the user opens the messages page to immediately clear the badge.
 */
export async function markAllMessagesAsRead() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const userId = session.user.id

    await db.message.updateMany({
      where: {
        tenantId,
        receiverId: userId,
        readAt: null,
        deletedByReceiver: false,
      },
      data: { readAt: new Date() },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Mark all messages as read error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function bulkDeleteMessages(messageIds: string[]) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const userId = session.user.id

    // Soft-delete sent messages
    await db.message.updateMany({
      where: { id: { in: messageIds }, tenantId, senderId: userId },
      data: { deletedBySender: true },
    })
    // Soft-delete received messages
    await db.message.updateMany({
      where: { id: { in: messageIds }, tenantId, receiverId: userId },
      data: { deletedByReceiver: true },
    })

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')

    return { success: true, deleted: messageIds.length }
  } catch (error: any) {
    console.error('Bulk delete messages error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

/**
 * Send a message from admin/moderator to multiple recipients at once.
 * Used for bulk messaging: all parents in a class/group, all staff, all teachers, etc.
 */
export async function sendBulkMessage(data: {
  recipientIds: string[]
  subject?: string
  content: string
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // MODERATOR permission check
    if (session.user.role === 'MODERATOR') {
      const perms = await getUserPermissions(session.user.id, session.user.tenantId!)
      if (!perms.messages?.includes('CREATE') && !perms.messages?.includes('ALL')) {
        return { success: false, error: 'Xabar yuborish uchun ruxsat yo\'q' }
      }
    }

    const tenantId = session.user.tenantId!

    if (!data.content?.trim()) {
      return { success: false, error: 'Xabar matni bo\'sh bo\'lishi mumkin emas' }
    }
    if (!data.recipientIds?.length) {
      return { success: false, error: 'Kamida bitta qabul qiluvchi tanlanishi shart' }
    }
    if (data.subject && data.subject.length > 200) {
      return { success: false, error: 'Mavzu 200 belgidan oshmasligi kerak' }
    }
    if (data.content.length > 5000) {
      return { success: false, error: 'Xabar 5000 belgidan oshmasligi kerak' }
    }

    // Verify all recipients exist in same tenant
    const recipients = await db.user.findMany({
      where: { id: { in: data.recipientIds }, tenantId },
      select: { id: true },
    })

    if (!recipients.length) {
      return { success: false, error: 'Qabul qiluvchilar topilmadi' }
    }

    // Create individual messages for each recipient
    await db.message.createMany({
      data: recipients.map(r => ({
        tenantId,
        senderId: session.user.id,
        receiverId: r.id,
        subject: data.subject?.trim() || null,
        content: data.content.trim(),
        status: 'SENT' as const,
      })),
    })

    revalidatePath('/admin/messages')
    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')

    return { success: true, count: recipients.length }
  } catch (error: any) {
    console.error('Bulk send message error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

