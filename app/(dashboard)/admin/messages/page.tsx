import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AdminMessagesClient } from './messages-admin-client'
import { ModeratorMessagesClient } from './moderator-messages-client'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import Link from 'next/link'
import { PermissionGate } from '@/components/admin/permission-gate'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const isModerator = session.user.role === 'MODERATOR'

  // ── MODERATOR: faqat o'z xabarlari ──────────────────────────────────────
  if (isModerator) {
    const [receivedMessages, sentMessages] = await Promise.all([
      db.message.findMany({
        where: { tenantId, receiverId: session.user.id, deletedByReceiver: false },
        include: {
          sender: { select: { id: true, fullName: true, role: true } },
          receiver: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.message.findMany({
        where: { tenantId, senderId: session.user.id, deletedBySender: false },
        include: {
          sender: { select: { id: true, fullName: true } },
          receiver: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xabarlar
            </h1>
            <p className="text-muted-foreground mt-1">
              Kiruvchi va chiquvchi xabarlaringiz
            </p>
          </div>
          <PermissionGate resource="messages" action="CREATE">
            <Button asChild className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/admin/messages/compose">
                <Send className="h-4 w-4" />
                Xabar Yuborish
              </Link>
            </Button>
          </PermissionGate>
        </div>

        <ModeratorMessagesClient
          receivedMessages={receivedMessages}
          sentMessages={sentMessages}
          currentUserId={session.user.id}
        />
      </div>
    )
  }

  // ── ADMIN / SUPER_ADMIN: barcha yozishmalarni monitoring ─────────────────
  const allMessages = await db.message.findMany({
    where: { tenantId },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
      receiver: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const totalMessages = allMessages.length
  const unreadMessages = allMessages.filter(m => !m.readAt).length
  const teacherMessages = allMessages.filter(m =>
    m.sender.role === 'TEACHER' || m.receiver.role === 'TEACHER'
  ).length
  const parentMessages = allMessages.filter(m =>
    m.sender.role === 'PARENT' || m.receiver.role === 'PARENT'
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Xabarlar Tizimi
          </h1>
          <p className="text-muted-foreground mt-1">
            O'qituvchilar va ota-onalar o'rtasidagi barcha xabarlarni kuzating
          </p>
        </div>
        <Button asChild className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Link href="/admin/messages/compose">
            <Send className="h-4 w-4" />
            Xabar Yuborish
          </Link>
        </Button>
      </div>

      <AdminMessagesClient
        allMessages={allMessages}
        totalMessages={totalMessages}
        unreadMessages={unreadMessages}
        teacherMessages={teacherMessages}
        parentMessages={parentMessages}
      />
    </div>
  )
}
