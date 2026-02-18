'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, MessageSquare, GraduationCap, School,
  Check, CheckCheck, Users, Mail, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string
  subject: string | null
  content: string
  createdAt: Date | string
  readAt: Date | string | null
  deletedBySender: boolean
  deletedByReceiver: boolean
  sender: { id: string; fullName: string; role?: string }
  receiver: { id: string; fullName: string; role?: string }
}

interface AdminMessagesClientProps {
  allMessages: Message[]
  totalMessages: number
  unreadMessages: number
  teacherMessages: number
  parentMessages: number
}

interface Conversation {
  pairKey: string
  userA: { id: string; fullName: string; role?: string }
  userB: { id: string; fullName: string; role?: string }
  messages: Message[]
  unreadCount: number
  lastMessage: Message
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-rose-500', 'bg-emerald-500',
]

function avatarColor(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0)
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map(p => p[0] || '').join('').toUpperCase().slice(0, 2)
}

function relativeTime(d: Date | string): string {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffH = diffMs / 3_600_000
  const diffD = diffMs / 86_400_000
  if (diffH < 24 && date.getDate() === now.getDate())
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  if (diffD < 7)
    return ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'][date.getDay()]
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
}

function msgTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

const UZ_MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
]

function dateLabel(d: Date | string): string {
  const date = new Date(d)
  return `${date.getFullYear()} Yil, ${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`
}

function sameDay(a: Date | string, b: Date | string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function roleLabel(role?: string): string {
  if (role === 'TEACHER') return "O'qituvchi"
  if (role === 'PARENT') return 'Ota-ona'
  if (role === 'ADMIN') return 'Admin'
  return role || ''
}

function roleBadgeColor(role?: string): string {
  if (role === 'TEACHER') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
  if (role === 'PARENT') return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
  if (role === 'ADMIN') return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
  return 'bg-muted text-muted-foreground'
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminMessagesClient({
  allMessages,
  totalMessages,
  unreadMessages,
  teacherMessages,
  parentMessages,
}: AdminMessagesClientProps) {
  const [selectedPairKey, setSelectedPairKey] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [search, setSearch] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Group all messages into conversations by unique user pair
  const conversations = useMemo((): Conversation[] => {
    const map = new Map<string, Conversation>()

    allMessages.forEach(msg => {
      const ids = [msg.sender.id, msg.receiver.id].sort()
      const pairKey = ids.join('-')

      if (!map.has(pairKey)) {
        map.set(pairKey, {
          pairKey,
          userA: msg.sender,
          userB: msg.receiver,
          messages: [],
          unreadCount: 0,
          lastMessage: msg,
        })
      }
      const conv = map.get(pairKey)!
      conv.messages.push(msg)
      if (!msg.readAt) conv.unreadCount++
      if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt))
        conv.lastMessage = msg
    })

    map.forEach(conv => {
      conv.messages.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    })

    return Array.from(map.values()).sort(
      (a, b) => +new Date(b.lastMessage.createdAt) - +new Date(a.lastMessage.createdAt)
    )
  }, [allMessages])

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(c =>
      c.userA.fullName.toLowerCase().includes(q) ||
      c.userB.fullName.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const activeConv = useMemo(
    () => conversations.find(c => c.pairKey === selectedPairKey) ?? null,
    [conversations, selectedPairKey]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.pairKey])

  return (
    <div className="flex flex-col gap-4">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">{totalMessages}</div>
            <div className="text-xs text-muted-foreground">Jami</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white shrink-0 shadow">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-600">{unreadMessages}</div>
            <div className="text-xs text-muted-foreground">Yangi</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shrink-0 shadow">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">{teacherMessages}</div>
            <div className="text-xs text-muted-foreground">O'qituvchilar</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shrink-0 shadow">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">{parentMessages}</div>
            <div className="text-xs text-muted-foreground">Ota-onalar</div>
          </div>
        </div>
      </div>

      {/* ── Telegram two-panel ── */}
      <div className={cn(
        'flex rounded-2xl overflow-hidden border border-border shadow-xl bg-background',
        'h-[calc(100vh-310px)] min-h-[520px]',
      )}>

        {/* ════ LEFT ════ */}
        <div className={cn(
          'w-full md:w-[320px] flex-shrink-0 flex flex-col border-r border-border',
          mobileView === 'chat' ? 'hidden md:flex' : 'flex',
        )}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Foydalanuvchi qidirish..."
                className="pl-8 h-8 text-sm bg-muted border-none rounded-xl focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="px-4 py-2 border-b border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suhbatlar · {filteredConvs.length}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 opacity-25" />
                <p className="text-sm text-center">{search ? 'Topilmadi' : "Suhbatlar yo'q"}</p>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const isActive = selectedPairKey === conv.pairKey
                const sender = conv.lastMessage.sender

                return (
                  <button
                    key={conv.pairKey}
                    onClick={() => { setSelectedPairKey(conv.pairKey); setMobileView('chat') }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      isActive
                        ? 'bg-primary/8 border-l-[3px] border-primary'
                        : 'hover:bg-muted/60 border-l-[3px] border-transparent',
                    )}
                  >
                    {/* Stacked avatars */}
                    <div className="relative w-11 h-11 shrink-0">
                      <div className={cn(
                        'absolute bottom-0 left-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-background shadow-sm',
                        avatarColor(conv.userB.fullName),
                      )}>
                        {initials(conv.userB.fullName)}
                      </div>
                      <div className={cn(
                        'absolute top-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-background shadow-sm',
                        avatarColor(conv.userA.fullName),
                      )}>
                        {initials(conv.userA.fullName)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold truncate text-foreground/80">
                          {conv.userA.fullName} ↔ {conv.userB.fullName}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-1">
                          {relativeTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-muted-foreground truncate">
                          <span className="font-medium">{sender.fullName.split(' ')[0]}:</span>
                          {' '}{conv.lastMessage.subject || conv.lastMessage.content}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ════ RIGHT ════ */}
        <div className={cn(
          'flex-1 flex flex-col',
          'bg-[#efeae2] dark:bg-[#0e1621]',
          mobileView === 'list' && !selectedPairKey ? 'hidden md:flex' : 'flex',
        )}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
              <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-white/5 flex items-center justify-center shadow-inner">
                <Eye className="w-10 h-10 opacity-30" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-foreground">Suhbatni tanlang</p>
                <p className="text-sm mt-1">O'qituvchi va ota-ona o'rtasidagi suhbatlarni kuzating</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#17212b] border-b border-border/50 shadow-sm">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  ←
                </button>

                {/* Two avatars */}
                <div className="relative w-10 h-9 shrink-0">
                  <div className={cn(
                    'absolute bottom-0 left-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-background shadow',
                    avatarColor(activeConv.userB.fullName),
                  )}>
                    {initials(activeConv.userB.fullName)}
                  </div>
                  <div className={cn(
                    'absolute top-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-background shadow',
                    avatarColor(activeConv.userA.fullName),
                  )}>
                    {initials(activeConv.userA.fullName)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm">{activeConv.userA.fullName}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', roleBadgeColor(activeConv.userA.role))}>
                      {roleLabel(activeConv.userA.role)}
                    </span>
                    <span className="text-muted-foreground text-xs">↔</span>
                    <span className="font-semibold text-sm">{activeConv.userB.fullName}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', roleBadgeColor(activeConv.userB.role))}>
                      {roleLabel(activeConv.userB.role)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeConv.messages.length} ta xabar · Monitoring rejimi
                  </p>
                </div>

                <Badge variant="outline" className="text-xs shrink-0 gap-1">
                  <Eye className="w-3 h-3" />
                  Kuzatish
                </Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {activeConv.messages.map((msg, idx) => {
                  const prev = activeConv.messages[idx - 1]
                  const showDate = !prev || !sameDay(msg.createdAt, prev.createdAt)
                  const prevSameSender = prev && prev.sender.id === msg.sender.id && !showDate
                  // For monitoring: alternate sides based on sender identity
                  // userA messages → left, userB messages → right
                  const isRight = msg.sender.id === activeConv.userB.id

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] bg-white/70 dark:bg-white/10 text-muted-foreground px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                            {dateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className={cn(
                        'flex items-end gap-1.5',
                        isRight ? 'flex-row-reverse' : 'flex-row',
                        prevSameSender ? 'mt-0.5' : 'mt-2',
                      )}>
                        {/* Avatar */}
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                          avatarColor(msg.sender.fullName),
                          prevSameSender && 'opacity-0 pointer-events-none',
                        )}>
                          {msg.sender.fullName.charAt(0).toUpperCase()}
                        </div>

                        <div className={cn('max-w-[72%] flex flex-col', isRight ? 'items-end' : 'items-start')}>
                          {/* Sender label (first of group) */}
                          {!prevSameSender && (
                            <div className={cn(
                              'flex items-center gap-1.5 mb-1',
                              isRight ? 'flex-row-reverse' : 'flex-row',
                            )}>
                              <span className="text-[11px] font-semibold text-foreground/70">
                                {msg.sender.fullName.split(' ')[0]}
                              </span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', roleBadgeColor(msg.sender.role))}>
                                {roleLabel(msg.sender.role)}
                              </span>
                            </div>
                          )}

                          <div className={cn(
                            'relative px-3.5 py-2 rounded-2xl shadow-sm text-sm',
                            isRight
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-[4px]'
                              : 'bg-white dark:bg-[#1e2533] text-foreground rounded-bl-[4px]',
                          )}>
                            {msg.subject && (
                              <p className={cn(
                                'text-xs font-semibold mb-1 pb-1 border-b',
                                isRight ? 'text-emerald-100 border-emerald-400/30' : 'text-primary border-primary/20',
                              )}>
                                {msg.subject}
                              </p>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            {/* Deletion status badges (visible only in admin panel) */}
                            {(msg.deletedBySender || msg.deletedByReceiver) && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {msg.deletedBySender && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                                    Yuboruvchi o'chirdi
                                  </span>
                                )}
                                {msg.deletedByReceiver && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                                    Qabul qiluvchi o'chirdi
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-0.5 mt-1 justify-end">
                              <span className={cn('text-[10px]', isRight ? 'text-emerald-100/80' : 'text-muted-foreground')}>
                                {msgTime(msg.createdAt)}
                              </span>
                              {msg.readAt
                                ? <CheckCheck className={cn('w-3.5 h-3.5', isRight ? 'text-emerald-100' : 'text-blue-500')} />
                                : <Check className={cn('w-3.5 h-3.5', isRight ? 'text-emerald-200/60' : 'text-muted-foreground')} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Read-only notice */}
              <div className="px-4 py-2.5 bg-white dark:bg-[#17212b] border-t border-border/50">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Admin monitoring rejimi — faqat ko'rish mumkin</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

