import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AnnouncementList } from '@/components/announcement-list'

export default async function ParentAnnouncementsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get announcements for parents (ALL or PARENTS)
  const announcements = await db.announcement.findMany({
    where: {
      tenantId,
      targetAudience: {
        in: ['ALL', 'PARENTS']
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      author: {
        select: { fullName: true }
      }
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">E'lonlar</h1>
        <p className="text-muted-foreground">
          Maktab e'lonlari va yangiliklar
        </p>
      </div>

      <AnnouncementList announcements={announcements} />
    </div>
  )
}

