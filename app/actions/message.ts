'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { messageSchema, MessageFormData, messageReplySchema, MessageReplyData } from '@/lib/validations/message'
import { revalidatePath } from 'next/cache'

export async function sendMessage(data: MessageFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['TEACHER', 'PARENT', 'ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
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
        subject: `Re: ${originalMessage.subject}`,
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
    
    return { success: true }
  } catch (error: any) {
    console.error('Mark as read error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if user is sender or recipient
    const message = await db.message.findFirst({
      where: { 
        id: messageId,
        tenantId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    })

    if (!message) {
      return { success: false, error: 'Xabar topilmadi' }
    }

    // Delete message
    await db.message.delete({
      where: { id: messageId }
    })

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete message error:', error)
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

export async function bulkDeleteMessages(messageIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Delete messages
    const result = await db.message.deleteMany({
      where: { 
        id: { in: messageIds },
        tenantId,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    })

    revalidatePath('/teacher/messages')
    revalidatePath('/parent/messages')
    
    return { success: true, deleted: result.count }
  } catch (error: any) {
    console.error('Bulk delete messages error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

