import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function UnreadMessagesBadge() {
  const session = await getServerSession(authOptions)

  if (!session) return null

  const unreadCount = await db.message.count({
    where: {
      tenantId: session.user.tenantId!,
      receiverId: session.user.id,
      readAt: null,
      deletedByReceiver: false, // Don't count soft-deleted messages
    }
  })

  if (unreadCount === 0) return null

  return (
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}

