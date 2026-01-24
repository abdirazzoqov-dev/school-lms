import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, MailOpen, Send, Inbox } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessagesClient } from './messages-client'

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Xabarlar
          </h1>
          <p className="text-lg text-muted-foreground">
            Ota-onalar bilan muloqot qiling
          </p>
        </div>
        <Link href="/teacher/messages/compose">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Yangi Xabar
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{unreadCount}</div>
                <p className="text-sm text-muted-foreground font-medium">O'qilmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{totalReceived}</div>
                <p className="text-sm text-muted-foreground font-medium">Qabul qilingan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{totalSent}</div>
                <p className="text-sm text-muted-foreground font-medium">Yuborilgan</p>
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

