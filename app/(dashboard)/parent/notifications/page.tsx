import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function ParentNotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get notifications
  const notifications = await db.notification.findMany({
    where: {
      tenantId,
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Last 50 notifications
  })

  // Group by read status
  const unreadNotifications = notifications.filter(n => !n.isRead)
  const readNotifications = notifications.filter(n => n.isRead)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'WARNING':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-50 border-blue-200'
      case 'SUCCESS':
        return 'bg-green-50 border-green-200'
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200'
      case 'ERROR':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bildirishnomalar</h1>
        <p className="text-muted-foreground">
          Barcha bildirishnomalar va yangiliklar
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <p className="text-sm text-muted-foreground">Jami</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unreadNotifications.length}</div>
                <p className="text-sm text-muted-foreground">O'qilmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{readNotifications.length}</div>
                <p className="text-sm text-muted-foreground">O'qilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              O'qilmagan Bildirishnomalar
              <Badge variant="secondary">{unreadNotifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-2 ${getNotificationBg(notification.type)}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        <Badge variant="secondary" className="text-xs">Yangi</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              O'qilgan Bildirishnomalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {readNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5 opacity-50">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 opacity-75">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 opacity-75">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground opacity-75">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bildirishnomalar yo'q</h3>
              <p className="text-muted-foreground">
                Hozircha sizga bildirishnomalar yuborilmagan
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Bildirishnomalar haqida
              </h3>
              <p className="text-sm text-blue-800">
                Bu yerda tizimdan, o'qituvchilardan va maktab boshqaruvidan
                keladigan barcha bildirishnomalarni ko'rishingiz mumkin.
                Muhim xabarlar va yangiliklar haqida xabardor bo'ling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
