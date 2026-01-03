import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Megaphone, Pin, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { AnnouncementList } from '@/components/announcement-list'
import { DeleteButton } from '@/components/delete-button'
import { deleteAnnouncement, toggleAnnouncementPin } from '@/app/actions/announcement'
import { AnnouncementsActions } from './announcements-actions'

// Optimized caching
export const revalidate = 30
export const dynamic = 'auto'

export default async function AdminAnnouncementsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all announcements
  const announcements = await db.announcement.findMany({
    where: { tenantId },
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

  // Statistics
  const totalAnnouncements = announcements.length
  const pinnedCount = announcements.filter(a => a.isPinned).length
  const activeCount = announcements.filter(a =>
    !a.expiresAt || new Date(a.expiresAt) > new Date()
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E'lonlar</h1>
          <p className="text-muted-foreground">
            Maktab e'lonlarini boshqaring
          </p>
        </div>
        <Link href="/admin/announcements/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yangi E'lon
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Megaphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalAnnouncements}</div>
                <p className="text-sm text-muted-foreground">Jami e'lonlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Pin className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pinnedCount}</div>
                <p className="text-sm text-muted-foreground">Muhim e'lonlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Megaphone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-sm text-muted-foreground">Faol e'lonlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <AnnouncementList
        announcements={announcements}
        showActions={true}
        actions={(announcement) => (
          <AnnouncementsActions announcement={announcement} />
        )}
      />
    </div>
  )
}

