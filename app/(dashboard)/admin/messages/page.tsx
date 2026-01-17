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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Xabarlar Tizimi</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Barcha xabarlarni kuzatish va monitoring
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <MessageSquare className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{totalMessages}</div>
                <p className="text-xs md:text-sm text-muted-foreground">Jami</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-1.5 md:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Mail className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{unreadMessages}</div>
                <p className="text-xs md:text-sm text-muted-foreground">Yangi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{teacherMessages}</div>
                <p className="text-xs md:text-sm text-muted-foreground">O'qituvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center gap-4">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Send className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{parentMessages}</div>
                <p className="text-xs md:text-sm text-muted-foreground">Ota-onalar</p>
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
                  className={`p-3 md:p-4 rounded-lg border ${
                    !message.readAt ? 'bg-blue-50 border-blue-200' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-2">
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {message.sender.role === 'TEACHER' && '👨‍🏫'}
                            {message.sender.role === 'PARENT' && '👨‍👩‍👧'}
                            {message.sender.role === 'ADMIN' && '👤'}
                          </Badge>
                          <span className="font-medium text-sm truncate">
                            {message.sender.fullName}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-sm hidden md:inline">→</span>
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {message.receiver.role === 'TEACHER' && '👨‍🏫'}
                            {message.receiver.role === 'PARENT' && '👨‍👩‍👧'}
                            {message.receiver.role === 'ADMIN' && '👤'}
                          </Badge>
                          <span className="font-medium text-sm truncate">
                            {message.receiver.fullName}
                          </span>
                        </div>
                      </div>
                      {message.subject && (
                        <h4 className="font-semibold text-sm mb-1">
                          {message.subject}
                        </h4>
                      )}
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                      {!message.readAt && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
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

