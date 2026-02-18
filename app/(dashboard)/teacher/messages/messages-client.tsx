'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteMessage, deleteConversation, markMessageAsRead, replyToMessage } from '@/app/actions/message'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Search, Plus, ArrowLeft, Trash2, Send, MessageSquare,
  GraduationCap, School, Check, CheckCheck, Mail, Inbox,
  MoreVertical, Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string
  subject: string | null
  content: string
  createdAt: Date | string
  readAt: Date | string | null
  sender: { id: string; fullName: string; role?: string }
  receiver: { id: string; fullName: string; role?: string }
  student?: {
    id: string
    studentCode: string
    user: { fullName: string } | null
    class: { name: string } | null
  } | null
}

interface MessagesClientProps {
  receivedMessages: Message[]
  sentMessages: Message[]
  currentUserId: string
}

interface Conversation {
  partnerId: string
  partnerName: string
  partnerRole: string
  messages: Message[]   // sorted asc by createdAt
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
    return ['Yak','Dush','Sesh','Chor','Pay','Jum','Shan'][date.getDay()]
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
}

function msgTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

function dateLabel(d: Date | string): string {
  return new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function sameDay(a: Date | string, b: Date | string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MessagesClient({ receivedMessages, sentMessages, currentUserId }: MessagesClientProps) {
  const router = useRouter()

  // Local deleted ids (optimistic)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // ── Delete modal state ──────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    type: 'message' | 'conversation'
    messageId?: string
    partnerId?: string
    canDeleteForEveryone?: boolean   // only sender may delete for both sides
  }>({ open: false, type: 'message' })
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Auto-polling: immediate refresh on mount, then every 3s ─────────────────
  useEffect(() => {
    const INTERVAL = 3_000
    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      router.refresh() // ← immediate refresh (no delay on first load)
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') router.refresh()
      }, INTERVAL)
    }
    const stop = () => { if (timer) { clearInterval(timer); timer = null } }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh() // ← immediate refresh when tab becomes visible
        start()
      } else {
        stop()
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [router])

  // Combine all messages, filter deleted
  const allMessages = useMemo(() => {
    return [...receivedMessages, ...sentMessages].filter(m => !deletedIds.has(m.id))
  }, [receivedMessages, sentMessages, deletedIds])

  // Group into conversations
  const conversations = useMemo((): Conversation[] => {
    const map = new Map<string, Conversation>()

    allMessages.forEach(msg => {
      const isReceived = msg.receiver.id === currentUserId
      const partner = isReceived ? msg.sender : msg.receiver

      if (!map.has(partner.id)) {
        map.set(partner.id, {
          partnerId: partner.id,
          partnerName: partner.fullName,
          partnerRole: partner.role || '',
          messages: [],
          unreadCount: 0,
          lastMessage: msg,
        })
      }
      const conv = map.get(partner.id)!
      conv.messages.push(msg)
      if (isReceived && !msg.readAt) conv.unreadCount++
      if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt))
        conv.lastMessage = msg
    })

    map.forEach(conv => {
      conv.messages.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    })

    return Array.from(map.values()).sort(
      (a, b) => +new Date(b.lastMessage.createdAt) - +new Date(a.lastMessage.createdAt)
    )
  }, [allMessages, currentUserId])

  // Filtered for search
  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations
    return conversations.filter(c => c.partnerName.toLowerCase().includes(search.toLowerCase()))
  }, [conversations, search])

  // Active conversation
  const activeConv = useMemo(
    () => conversations.find(c => c.partnerId === selectedPartnerId) ?? null,
    [conversations, selectedPartnerId]
  )

  // Stats
  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unreadCount, 0), [conversations])

  // Mark as read when opening conversation
  useEffect(() => {
    if (!activeConv) return
    const unread = activeConv.messages.filter(m => m.receiver.id === currentUserId && !m.readAt)
    unread.forEach(m => markMessageAsRead(m.id).catch(() => {}))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.partnerId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.partnerId, allMessages.length])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const selectConversation = (id: string) => {
    setSelectedPartnerId(id)
    setReplyText('')
    setMobileView('chat')
  }

  // Open delete modal for a single message (only sender can delete for both sides)
  const handleDelete = (messageId: string) => {
    const msg = allMessages.find(m => m.id === messageId)
    const canDeleteForEveryone = msg?.sender.id === currentUserId
    setDeleteModal({ open: true, type: 'message', messageId, canDeleteForEveryone })
  }

  // Open delete modal for an entire conversation
  // "Delete for both sides" only available if current user sent at least one message
  const handleDeleteConversation = (partnerId: string) => {
    const conv = conversations.find(c => c.partnerId === partnerId)
    const canDeleteForEveryone = conv?.messages.some(m => m.sender.id === currentUserId) ?? false
    setDeleteModal({ open: true, type: 'conversation', partnerId, canDeleteForEveryone })
  }

  // Confirm deletion after user chooses scope
  const confirmDelete = async (forEveryone: boolean) => {
    setDeleteModal(m => ({ ...m, open: false }))

    if (deleteModal.type === 'message' && deleteModal.messageId) {
      const id = deleteModal.messageId
      setDeletedIds(prev => new Set([...prev, id]))
      const result = await deleteMessage(id, forEveryone)
      if (result.success) {
        toast.success(forEveryone ? "Xabar ikki tarafdan o'chirildi" : "Xabar faqat sizda o'chirildi")
        router.refresh()
      } else {
        setDeletedIds(prev => { const s = new Set(prev); s.delete(id); return s })
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } else if (deleteModal.type === 'conversation' && deleteModal.partnerId) {
      const pid = deleteModal.partnerId
      const result = await deleteConversation(pid, forEveryone)
      if (result.success) {
        toast.success(forEveryone ? "Suhbat ikki tarafdan o'chirildi" : "Suhbat faqat sizda o'chirildi")
        setSelectedPartnerId(null)
        setMobileView('list')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeConv) return
    setIsSending(true)
    try {
      const lastReceived = activeConv.messages.filter(m => m.receiver.id === currentUserId).at(-1)
      if (!lastReceived) {
        toast.error('Javob yuborish uchun avval xabar qabul qiling')
        return
      }
      const result = await replyToMessage(lastReceived.id, { content: replyText.trim() })
      if (result.success) {
        setReplyText('')
        toast.success('Xabar yuborildi')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  // Whether inline reply is available (need at least one received message from partner)
  const canReplyInline = activeConv
    ? activeConv.messages.some(m => m.receiver.id === currentUserId)
    : false

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="flex flex-col gap-4">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">{totalUnread}</div>
            <div className="text-xs text-muted-foreground">O'qilmagan</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">{receivedMessages.length}</div>
            <div className="text-xs text-muted-foreground">Qabul qilingan</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shrink-0 shadow">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">{sentMessages.length}</div>
            <div className="text-xs text-muted-foreground">Yuborilgan</div>
          </div>
        </div>
      </div>

      {/* ── Telegram two-panel ── */}
      <div className={cn(
        'flex rounded-2xl overflow-hidden border border-border shadow-xl bg-background',
        'h-[calc(100vh-300px)] min-h-[520px]',
      )}>

        {/* ════ LEFT: conversation list ════ */}
        <div className={cn(
          'w-full md:w-[320px] flex-shrink-0 flex flex-col border-r border-border',
          mobileView === 'chat' ? 'hidden md:flex' : 'flex',
        )}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="pl-8 h-8 text-sm bg-muted border-none rounded-xl focus-visible:ring-0"
              />
            </div>
            <Link href="/teacher/messages/compose">
              <Button
                size="sm"
                className="h-8 w-8 p-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none shadow"
                title="Yangi xabar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Section label */}
          <div className="px-4 py-2 border-b border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suhbatlar · {filteredConvs.length}
              {totalUnread > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {totalUnread}
                </span>
              )}
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 opacity-25" />
                <p className="text-sm text-center">
                  {search ? 'Topilmadi' : "Xabarlar yo'q"}
                </p>
                <Link href="/teacher/messages/compose">
                  <Button size="sm" variant="outline" className="mt-2 gap-1.5 rounded-xl">
                    <Plus className="w-3.5 h-3.5" /> Yangi xabar
                  </Button>
                </Link>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const isActive = selectedPartnerId === conv.partnerId
                const fromMe = conv.lastMessage.sender.id === currentUserId

                return (
                  <button
                    key={conv.partnerId}
                    onClick={() => selectConversation(conv.partnerId)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      isActive
                        ? 'bg-primary/8 border-l-[3px] border-primary'
                        : 'hover:bg-muted/60 border-l-[3px] border-transparent',
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm',
                      avatarColor(conv.partnerName),
                    )}>
                      {initials(conv.partnerName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn(
                          'text-sm font-semibold truncate',
                          conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground/80',
                        )}>
                          {conv.partnerName}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-1">
                          {relativeTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {fromMe && (
                            <span className="inline-flex items-center gap-0.5 mr-0.5">
                              {conv.lastMessage.readAt
                                ? <CheckCheck className="w-3 h-3 text-blue-400" />
                                : <Check className="w-3 h-3 text-muted-foreground" />}
                            </span>
                          )}
                          {conv.lastMessage.subject || conv.lastMessage.content}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
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

        {/* ════ RIGHT: chat view ════ */}
        <div className={cn(
          'flex-1 flex flex-col',
          // chat background (like Telegram)
          'bg-[#efeae2] dark:bg-[#0e1621]',
          mobileView === 'list' && !selectedPartnerId ? 'hidden md:flex' : 'flex',
        )}>
          {!activeConv ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
              <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-white/5 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-10 h-10 opacity-30" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-foreground">Suhbatni tanlang</p>
                <p className="text-sm mt-1">Chap paneldan suhbatni bosing</p>
              </div>
              <Link href="/teacher/messages/compose">
                <Button className="mt-2 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <Plus className="w-4 h-4" /> Yangi xabar yozing
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* ── Chat header ── */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#17212b] border-b border-border/50 shadow-sm">
                {/* Mobile back */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow',
                  avatarColor(activeConv.partnerName),
                )}>
                  {initials(activeConv.partnerName)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">
                    {activeConv.partnerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeConv.partnerRole === 'PARENT' ? 'Ota-ona' : activeConv.partnerRole}
                    {' · '}
                    {activeConv.messages.length} ta xabar
                  </p>
                </div>

                {/* Delete conversation button */}
                <button
                  onClick={() => handleDeleteConversation(activeConv.partnerId)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Suhbatni o'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {activeConv.messages.map((msg, idx) => {
                  const isMine = msg.sender.id === currentUserId
                  const prev = activeConv.messages[idx - 1]
                  const showDate = !prev || !sameDay(msg.createdAt, prev.createdAt)
                  const prevSameSender = prev && prev.sender.id === msg.sender.id && !showDate

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] bg-white/70 dark:bg-white/10 text-muted-foreground px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                            {dateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* Bubble row */}
                      <div className={cn(
                        'flex items-end gap-1.5 group',
                        isMine ? 'flex-row-reverse' : 'flex-row',
                        prevSameSender ? 'mt-0.5' : 'mt-2',
                      )}>
                        {/* Avatar (only for first of a group, received) */}
                        {!isMine && (
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                            avatarColor(msg.sender.fullName),
                            prevSameSender && 'opacity-0 pointer-events-none',
                          )}>
                            {msg.sender.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Spacer for my messages (right side) */}
                        {isMine && <div className="w-7" />}

                        {/* Bubble */}
                        <div className={cn(
                          'max-w-[72%] flex flex-col',
                          isMine ? 'items-end' : 'items-start',
                        )}>
                          <div className={cn(
                            'relative px-3.5 py-2 rounded-2xl shadow-sm text-sm',
                            isMine
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-[4px]'
                              : 'bg-white dark:bg-[#1e2533] text-foreground rounded-bl-[4px]',
                          )}>
                            {/* Subject */}
                            {msg.subject && (
                              <p className={cn(
                                'text-xs font-semibold mb-1 pb-1 border-b',
                                isMine
                                  ? 'text-blue-100 border-blue-400/30'
                                  : 'text-primary border-primary/20',
                              )}>
                                {msg.subject}
                              </p>
                            )}

                            {/* Student context */}
                            {msg.student && (
                              <div className={cn(
                                'flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] mb-2 px-2 py-1.5 rounded-lg',
                                isMine
                                  ? 'bg-white/10 text-blue-100'
                                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40',
                              )}>
                                <GraduationCap className="w-3 h-3" />
                                <span>{msg.student.user?.fullName || "Noma'lum"}</span>
                                {msg.student.class && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <School className="w-3 h-3" />
                                    <span>{msg.student.class.name}</span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Content */}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            {/* Time + ticks */}
                            <div className={cn(
                              'flex items-center gap-0.5 mt-1 select-none',
                              isMine ? 'justify-end' : 'justify-end',
                            )}>
                              <span className={cn(
                                'text-[10px]',
                                isMine ? 'text-blue-100/80' : 'text-muted-foreground',
                              )}>
                                {msgTime(msg.createdAt)}
                              </span>
                              {isMine && (
                                msg.readAt
                                  ? <CheckCheck className="w-3.5 h-3.5 text-blue-100" />
                                  : <Check className="w-3.5 h-3.5 text-blue-200/60" />
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Reply input ── */}
              <div className="px-3 py-3 bg-white dark:bg-[#17212b] border-t border-border/50">
                {canReplyInline ? (
                  <>
                    <div className="flex items-end gap-2 bg-muted dark:bg-[#242f3d] rounded-2xl px-3.5 py-2">
                      <Textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Xabar yozing..."
                        rows={1}
                        className="flex-1 bg-transparent border-none resize-none text-sm py-0.5 min-h-[30px] max-h-[100px] focus-visible:ring-0 shadow-none p-0 placeholder:text-muted-foreground/60"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isSending}
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
                          replyText.trim()
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg scale-100 hover:scale-105'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isSending
                          ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
                      Enter — yuborish · Shift+Enter — yangi qator
                    </p>
                  </>
                ) : (
                  /* No received message yet — can't use replyTo, redirect to compose */
                  <div className="flex items-center justify-between gap-3 px-2 py-1">
                    <p className="text-xs text-muted-foreground">
                      Yangi mavzu bilan xabar yuboring
                    </p>
                    <Link href={`/teacher/messages/compose?parentId=${activeConv.partnerId}`}>
                      <Button size="sm" className="gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <Pencil className="w-3.5 h-3.5" /> Xabar yozish
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* ── Delete confirmation modal ─────────────────────────────────────── */}
    <Dialog open={deleteModal.open} onOpenChange={open => setDeleteModal(m => ({ ...m, open }))}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            {deleteModal.type === 'conversation' ? "Suhbatni o'chirish" : "Xabarni o'chirish"}
          </DialogTitle>
          <DialogDescription>
            {deleteModal.type === 'conversation'
              ? "Bu suhbatdagi barcha xabarlar o'chiriladi."
              : "Bu xabar o'chiriladi."}
            {' '}Qayerdan o'chirilsin?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Only the sender may delete for everyone */}
          {deleteModal.canDeleteForEveryone && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => confirmDelete(true)}
            >
              <Trash2 className="w-4 h-4" />
              Ikki tarafdan o'chirish
            </Button>
          )}
          <Button
            variant={deleteModal.canDeleteForEveryone ? 'outline' : 'destructive'}
            className="w-full gap-2"
            onClick={() => confirmDelete(false)}
          >
            <Trash2 className="w-4 h-4" />
            Faqat menda o'chirish
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setDeleteModal(m => ({ ...m, open: false }))}
          >
            Bekor qilish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
