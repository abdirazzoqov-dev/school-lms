import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, MessageSquare, Users } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Optimized caching
export const revalidate = 30
export const dynamic = 'auto'

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all messages in the system
  const allMessages = await db.message.findMany({
    where: { tenantId },
    include: {
      sender: {
        select: { id: true, fullName: true, role: true }
      },
      receiver: {
        select: { id: true, fullName: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // Last 100 messages
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Xabarlar Tizimi</h1>
        <p className="text-muted-foreground">
          Barcha xabarlarni kuzatish va monitoring
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMessages}</div>
                <p className="text-sm text-muted-foreground">Jami xabarlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unreadMessages}</div>
                <p className="text-sm text-muted-foreground">O'qilmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teacherMessages}</div>
                <p className="text-sm text-muted-foreground">O'qituvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{parentMessages}</div>
                <p className="text-sm text-muted-foreground">Ota-onalar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Oxirgi Xabarlar</span>
            <Badge variant="secondary">{allMessages.length} ta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Xabarlar yo'q</h3>
              <p className="text-muted-foreground">
                Tizimda hozircha xabarlar mavjud emas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border ${
                    !message.readAt ? 'bg-blue-50 border-blue-200' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {message.sender.role === 'TEACHER' && '👨‍🏫 O\'qituvchi'}
                          {message.sender.role === 'PARENT' && '👨‍👩‍👧 Ota-ona'}
                          {message.sender.role === 'ADMIN' && '👤 Admin'}
                        </Badge>
                        <span className="font-medium text-sm">
                          {message.sender.fullName}
                        </span>
                        <span className="text-muted-foreground text-sm">→</span>
                        <Badge variant="outline" className="text-xs">
                          {message.receiver.role === 'TEACHER' && '👨‍🏫 O\'qituvchi'}
                          {message.receiver.role === 'PARENT' && '👨‍👩‍👧 Ota-ona'}
                          {message.receiver.role === 'ADMIN' && '👤 Admin'}
                        </Badge>
                        <span className="font-medium text-sm">
                          {message.receiver.fullName}
                        </span>
                      </div>
                      {message.subject && (
                        <h4 className="font-semibold text-sm mb-1">
                          {message.subject}
                        </h4>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!message.readAt && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Yangi
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Xabarlar Tizimi Monitoring
              </h3>
              <p className="text-sm text-blue-800">
                Bu yerda o'qituvchilar va ota-onalar o'rtasidagi barcha xabarlarni
                kuzatishingiz mumkin. Tizim faoliyatini monitoring qilish va kerak
                bo'lsa yordam berish uchun foydalaning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

