import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MessagesClient } from './messages-client'

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get received messages
  const receivedMessages = await db.message.findMany({
    where: {
      tenantId,
      receiverId: session.user.id,
    },
    include: {
      sender: {
        select: { id: true, fullName: true, role: true }
      },
      receiver: {
        select: { id: true, fullName: true }
      },
      student: {
        select: {
          id: true,
          studentCode: true,
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get sent messages
  const sentMessages = await db.message.findMany({
    where: {
      tenantId,
      senderId: session.user.id,
    },
    include: {
      sender: {
        select: { id: true, fullName: true }
      },
      receiver: {
        select: { id: true, fullName: true, role: true }
      },
      student: {
        select: {
          id: true,
          studentCode: true,
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Statistics
  const unreadCount = receivedMessages.filter(m => !m.readAt).length
  const totalReceived = receivedMessages.length
  const totalSent = sentMessages.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Xabarlar
        </h1>
        <p className="text-muted-foreground mt-1">Ota-onalar bilan muloqot qiling</p>
      </div>

      <MessagesClient
        receivedMessages={receivedMessages}
        sentMessages={sentMessages}
        currentUserId={session.user.id}
      />
    </div>
  )
}

