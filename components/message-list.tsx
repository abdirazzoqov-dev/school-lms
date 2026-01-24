'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, MailOpen, Trash2, Reply, Clock, User, GraduationCap, School } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { useState } from 'react'

interface Message {
  id: string
  subject: string | null
  content: string
  createdAt: Date
  readAt: Date | null
  sender: {
    id: string
    fullName: string
    role?: string
  }
  receiver: {
    id: string
    fullName: string
    role?: string
  }
  student?: {
    id: string
    studentCode: string
    user: {
      fullName: string
    } | null
    class: {
      name: string
    } | null
  } | null
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onDelete?: (messageId: string) => void
  onReply?: (messageId: string) => void
}

export function MessageList({ messages, currentUserId, onDelete, onReply }: MessageListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (messages.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/20 w-fit mx-auto mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Xabarlar yo'q</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Hozircha xabarlar mavjud emas. Ota-onalar bilan muloqot qilish uchun yangi xabar yozing.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isReceived = message.receiver.id === currentUserId
        const isUnread = !message.readAt && isReceived
        const isExpanded = expandedId === message.id
        const otherPerson = isReceived ? message.sender : message.receiver

        return (
          <Card 
            key={message.id} 
            className={`group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 ${
              isUnread ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20' : ''
            }`}
          >
            {/* Gradient indicator for unread */}
            {isUnread && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600" />
            )}

            <CardContent className="pt-6 pl-8">
              <div 
                className="cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : message.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl shadow-lg ${
                      isUnread 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {isUnread ? (
                        <Mail className="h-5 w-5" />
                      ) : (
                        <MailOpen className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {isReceived ? 'Dan' : 'Ga'}:
                          </span>
                          <span className={`font-bold ${isUnread ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}>
                            {otherPerson.fullName}
                          </span>
                          {otherPerson.role === 'PARENT' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Ota-ona
                            </Badge>
                          )}
                        </div>
                        {isUnread && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none">
                            Yangi
                          </Badge>
                        )}
                      </div>
                      
                      {/* Student Info - if available */}
                      {message.student && (
                        <div className="flex items-center gap-4 text-sm bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-amber-600" />
                            <span className="text-muted-foreground">O&apos;quvchi:</span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                              {message.student.user?.fullName || "Noma'lum"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({message.student.studentCode})
                            </span>
                          </div>
                          {message.student.class && (
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-amber-600" />
                              <span className="text-muted-foreground">Sinf:</span>
                              <span className="font-semibold text-amber-700 dark:text-amber-400">
                                {message.student.class.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      
                      {/* Subject */}
                      <p className={`text-lg font-semibold ${isUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {message.subject || "Mavzu yo'q"}
                      </p>
                      
                      {/* Preview */}
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                      )}
                      
                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(new Date(message.createdAt))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isReceived && onReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950/50"
                        onClick={(e) => {
                          e.stopPropagation()
                          onReply(message.id)
                        }}
                        title="Javob berish"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(message.id)
                        }}
                        title="O'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    {message.readAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                        <MailOpen className="h-3 w-3" />
                        O'qilgan: {formatDateTime(new Date(message.readAt))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

