'use client'

import { Button } from '@/components/ui/button'
import { Pin, PinOff, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteAnnouncement, toggleAnnouncementPin } from '@/app/actions/announcement'

interface AnnouncementsActionsProps {
  announcement: any
}

export function AnnouncementsActions({ announcement }: AnnouncementsActionsProps) {
  const router = useRouter()

  const handlePin = async () => {
    const result = await toggleAnnouncementPin(announcement.id)
    if (result.success) {
      toast.success(announcement.isPinned ? 'Muhimlikdan chiqarildi' : 'Muhim deb belgilandi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`"${announcement.title}" e'lonini o'chirmoqchimisiz?`)) return

    const result = await deleteAnnouncement(announcement.id)
    if (result.success) {
      toast.success('E\'lon o\'chirildi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePin}
        title={announcement.isPinned ? 'Muhimlikdan chiqarish' : 'Muhim deb belgilash'}
      >
        {announcement.isPinned ? (
          <PinOff className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
      </Button>
      
      <Link href={`/admin/announcements/${announcement.id}/edit`}>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  )
}

