'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, MailOpen, Trash2, Reply } from 'lucide-react'
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
  }
  receiver: {
    id: string
    fullName: string
  }
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
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Xabarlar yo'q</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => {
        const isReceived = message.receiver.id === currentUserId
        const isUnread = !message.readAt && isReceived
        const isExpanded = expandedId === message.id
        const otherPerson = isReceived ? message.sender : message.receiver

        return (
          <Card 
            key={message.id} 
            className={`${isUnread ? 'border-blue-500 bg-blue-50/50' : ''} hover:shadow-md transition-shadow`}
          >
            <CardContent className="pt-6">
              <div 
                className="cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : message.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {isUnread ? (
                        <Mail className="h-5 w-5 text-blue-600" />
                      ) : (
                        <MailOpen className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${isUnread ? 'text-blue-600' : ''}`}>
                          {isReceived ? 'Dan' : 'Ga'}: {otherPerson.fullName}
                        </span>
                        {isUnread && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Yangi
                          </span>
                        )}
                      </div>
                      
                      <p className={`font-medium mb-1 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {message.subject || 'Mavzu yo\'q'}
                      </p>
                      
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {message.content}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(new Date(message.createdAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {isReceived && onReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onReply(message.id)
                        }}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(message.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.readAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        O'qilgan: {formatDateTime(new Date(message.readAt))}
                      </p>
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

