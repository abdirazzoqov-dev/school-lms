import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pin, Clock, Users } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { getPriorityColor, getPriorityLabel, TARGET_AUDIENCES } from '@/lib/validations/announcement'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  targetAudience: string
  isPinned: boolean
  expiresAt: Date | null
  createdAt: Date
  author: {
    fullName: string
  }
}

interface AnnouncementListProps {
  announcements: Announcement[]
  showActions?: boolean
  actions?: (announcement: Announcement) => React.ReactNode
}

export function AnnouncementList({ announcements, showActions = false, actions }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Hozircha e'lonlar yo'q</p>
        </CardContent>
      </Card>
    )
  }

  // Separate pinned and unpinned
  const pinnedAnnouncements = announcements.filter(a => a.isPinned)
  const unpinnedAnnouncements = announcements.filter(a => !a.isPinned)

  const renderAnnouncement = (announcement: Announcement) => {
    const priorityColor = getPriorityColor(announcement.priority)
    const priorityLabel = getPriorityLabel(announcement.priority)
    const targetLabel = TARGET_AUDIENCES.find(t => t.value === announcement.targetAudience)?.label

    const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()
    const isExpiringSoon = announcement.expiresAt && 
      new Date(announcement.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000) &&
      !isExpired

    return (
      <Card 
        key={announcement.id}
        className={`${announcement.isPinned ? 'border-yellow-500 bg-yellow-50/50' : ''} ${isExpired ? 'opacity-60' : ''}`}
      >
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.isPinned && (
                    <Pin className="h-4 w-4 text-yellow-600" />
                  )}
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Priority Badge */}
                  <Badge 
                    variant="outline"
                    className={`
                      ${priorityColor === 'red' ? 'border-red-500 text-red-700 bg-red-50' : ''}
                      ${priorityColor === 'orange' ? 'border-orange-500 text-orange-700 bg-orange-50' : ''}
                      ${priorityColor === 'blue' ? 'border-blue-500 text-blue-700 bg-blue-50' : ''}
                      ${priorityColor === 'gray' ? 'border-gray-500 text-gray-700 bg-gray-50' : ''}
                    `}
                  >
                    {priorityLabel}
                  </Badge>

                  {/* Target Audience Badge */}
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {targetLabel}
                  </Badge>

                  {/* Expiration Warning */}
                  {isExpiringSoon && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
                      <Clock className="h-3 w-3 mr-1" />
                      Tez orada tugaydi
                    </Badge>
                  )}

                  {isExpired && (
                    <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
                      Muddati o'tgan
                    </Badge>
                  )}
                </div>
              </div>

              {showActions && actions && (
                <div className="flex gap-2">
                  {actions(announcement)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{announcement.content}</p>
            </div>

            {/* Footer */}
            <div className="text-xs text-muted-foreground pt-2 border-t flex items-center justify-between">
              <div>
                <span className="font-medium">{announcement.author.fullName}</span>
                <span className="mx-2">•</span>
                <span>{formatDateTime(new Date(announcement.createdAt))}</span>
              </div>
              {announcement.expiresAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Amal qiladi: {formatDateTime(new Date(announcement.expiresAt))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            📌 Muhim e'lonlar
          </h3>
          <div className="space-y-3">
            {pinnedAnnouncements.map(renderAnnouncement)}
          </div>
        </>
      )}

      {/* Regular Announcements */}
      {unpinnedAnnouncements.length > 0 && (
        <>
          {pinnedAnnouncements.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-6">
              Barcha e'lonlar
            </h3>
          )}
          <div className="space-y-3">
            {unpinnedAnnouncements.map(renderAnnouncement)}
          </div>
        </>
      )}
    </div>
  )
}

