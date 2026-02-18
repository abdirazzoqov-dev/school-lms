import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AdminMessagesClient } from './messages-admin-client'

export const revalidate = 30
export const dynamic = 'auto'

export default async function AdminMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all messages in the system (last 200)
  const allMessages = await db.message.findMany({
    where: { tenantId },
    include: {
      sender: {
        select: { id: true, fullName: true, role: true }
      },
      receiver: {
        select: { id: true, fullName: true, role: true }
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Statistics
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
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Xabarlar Tizimi
        </h1>
        <p className="text-muted-foreground mt-1">
          O'qituvchilar va ota-onalar o'rtasidagi barcha xabarlarni kuzating
        </p>
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
