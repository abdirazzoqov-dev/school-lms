import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Inbox, Send } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessagesClient } from './messages-client'

export default async function ParentMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent
  const parent = await db.parent.findFirst({
    where: { userId: session.user.id }
  })

  if (!parent) {
    redirect('/unauthorized')
  }

  // Get received messages
  const receivedMessages = await db.message.findMany({
    where: {
      tenantId,
      receiverId: session.user.id,
    },
    include: {
      sender: {
        select: { id: true, fullName: true, role: true }
      },
      receiver: {
        select: { id: true, fullName: true }
      },
      student: {
        select: {
          id: true,
          studentCode: true,
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get sent messages
  const sentMessages = await db.message.findMany({
    where: {
      tenantId,
      senderId: session.user.id,
    },
    include: {
      sender: {
        select: { id: true, fullName: true }
      },
      receiver: {
        select: { id: true, fullName: true, role: true }
      },
      student: {
        select: {
          id: true,
          studentCode: true,
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Statistics
  const unreadCount = receivedMessages.filter(m => !m.readAt).length
  const totalReceived = receivedMessages.length
  const totalSent = sentMessages.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xabarlar</h1>
          <p className="text-muted-foreground">
            O'qituvchilar bilan muloqot
          </p>
        </div>
        <Link href="/parent/messages/compose">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yangi Xabar
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unreadCount}</div>
                <p className="text-sm text-muted-foreground">O'qilmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Inbox className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalReceived}</div>
                <p className="text-sm text-muted-foreground">Qabul qilingan</p>
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
                <div className="text-2xl font-bold">{totalSent}</div>
                <p className="text-sm text-muted-foreground">Yuborilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Tabs */}
      <MessagesClient
        receivedMessages={receivedMessages}
        sentMessages={sentMessages}
        currentUserId={session.user.id}
      />
    </div>
  )
}

