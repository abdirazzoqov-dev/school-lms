'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Send,
  Users,
  GraduationCap,
  Briefcase,
  Search,
  CheckSquare,
  Square,
  X,
  BookOpen,
  UsersRound,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { sendBulkMessage } from '@/app/actions/message'
import { useToast } from '@/components/ui/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────
type ClassData = {
  id: string
  name: string
  gradeLevel: number
  studentCount: number
  parents: { userId: string; name: string }[]
}

type GroupData = {
  id: string
  name: string
  studentCount: number
  parents: { userId: string; name: string }[]
}

type ParentData = {
  userId: string
  name: string
  studentInfo: string
}

type TeacherData = {
  userId: string
  name: string
  subjects: string[]
}

type StaffData = {
  userId: string
  name: string
  position: string
}

interface ComposeMessageFormProps {
  classesData: ClassData[]
  groupsData: GroupData[]
  parentsData: ParentData[]
  teachersData: TeacherData[]
  staffData: StaffData[]
  senderName: string
}

// ─── Recipient Badge ──────────────────────────────────────────────────────────
function RecipientBadge({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
      <span className="max-w-[120px] truncate">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

// ─── Checkable List Item ──────────────────────────────────────────────────────
function CheckableItem({
  id,
  checked,
  onToggle,
  name,
  sub,
}: {
  id: string
  checked: boolean
  onToggle: (id: string) => void
  name: string
  sub?: string
}) {
  return (
    <label
      htmlFor={`chk-${id}`}
      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
        checked ? 'border-primary/50 bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted/50'
      }`}
    >
      <Checkbox
        id={`chk-${id}`}
        checked={checked}
        onCheckedChange={() => onToggle(id)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-none">{name}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      </div>
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ComposeMessageForm({
  classesData,
  groupsData,
  parentsData,
  teachersData,
  staffData,
}: ComposeMessageFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Recipient state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  // Name lookup for badge display
  const nameMap = useMemo(() => {
    const map = new Map<string, string>()
    parentsData.forEach(p => map.set(p.userId, p.name))
    teachersData.forEach(t => map.set(t.userId, t.name))
    staffData.forEach(s => map.set(s.userId, s.name))
    return map
  }, [parentsData, teachersData, staffData])

  // Parent tab state
  const [parentMode, setParentMode] = useState<'class' | 'group' | 'individual'>('class')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [parentSearch, setParentSearch] = useState('')

  // Staff/Teacher tab state
  const [staffSearch, setStaffSearch] = useState('')
  const [staffTeacherMode, setStaffTeacherMode] = useState<'all-staff' | 'all-teachers' | 'all' | 'individual'>('individual')

  // Message state
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const addUsers = (userIds: string[]) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      userIds.forEach(id => next.add(id))
      return next
    })
  }

  const removeUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  // ── Parent tab logic ──────────────────────────────────────────────────────
  const selectedClass = classesData.find(c => c.id === selectedClassId)
  const selectedGroup = groupsData.find(g => g.id === selectedGroupId)

  const filteredParents = useMemo(() => {
    const q = parentSearch.toLowerCase()
    return parentsData.filter(
      p => !q || p.name.toLowerCase().includes(q) || p.studentInfo.toLowerCase().includes(q)
    )
  }, [parentsData, parentSearch])

  const handleSelectClass = () => {
    if (selectedClass) addUsers(selectedClass.parents.map(p => p.userId))
  }
  const handleSelectGroup = () => {
    if (selectedGroup) addUsers(selectedGroup.parents.map(p => p.userId))
  }
  const handleSelectAllParents = () => addUsers(parentsData.map(p => p.userId))

  // ── Staff/Teacher tab logic ───────────────────────────────────────────────
  const combinedList = useMemo(() => {
    const q = staffSearch.toLowerCase()
    const teachers = teachersData
      .filter(t => !q || t.name.toLowerCase().includes(q))
      .map(t => ({
        userId: t.userId,
        name: t.name,
        sub: t.subjects.length ? t.subjects.slice(0, 2).join(', ') : '',
        type: 'teacher' as const,
      }))
    const staff = staffData
      .filter(s => !q || s.name.toLowerCase().includes(q))
      .map(s => ({
        userId: s.userId,
        name: s.name,
        sub: s.position,
        type: 'staff' as const,
      }))
    return [...teachers, ...staff]
  }, [teachersData, staffData, staffSearch])

  const handleSelectAllStaff = () => addUsers(staffData.map(s => s.userId))
  const handleSelectAllTeachers = () => addUsers(teachersData.map(t => t.userId))
  const handleSelectAllStaffTeachers = () => {
    addUsers(staffData.map(s => s.userId))
    addUsers(teachersData.map(t => t.userId))
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!content.trim()) {
      toast({ variant: 'destructive', title: 'Xabar matni kiritilishi shart' })
      return
    }
    if (selectedUserIds.size === 0) {
      toast({ variant: 'destructive', title: 'Kamida bitta qabul qiluvchi tanlang' })
      return
    }

    startTransition(async () => {
      const result = await sendBulkMessage({
        recipientIds: Array.from(selectedUserIds),
        subject: subject.trim() || undefined,
        content: content.trim(),
      })

      if (result.success) {
        toast({
          title: 'Xabarlar yuborildi!',
          description: `${result.count} ta qabul qiluvchiga xabar yuborildi.`,
        })
        router.push('/admin/messages')
        router.refresh()
      } else {
        toast({ variant: 'destructive', title: result.error || 'Xatolik yuz berdi' })
      }
    })
  }

  const selectedCount = selectedUserIds.size
  const selectedNames = Array.from(selectedUserIds)
    .slice(0, 5)
    .map(id => nameMap.get(id) || id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Xabar Yuborish</h1>
          <p className="text-sm text-muted-foreground">
            Ota-onalar, xodimlar va o'qituvchilarga xabar yuboring
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: Recipient Selection (3 cols) ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Qabul qiluvchilarni tanlang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="parents">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="parents" className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Ota-onalar
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    Xodim / O'qituvchi
                  </TabsTrigger>
                </TabsList>

                {/* ── Parents Tab ──────────────────────────────────────── */}
                <TabsContent value="parents" className="space-y-4 mt-0">
                  {/* Mode selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: 'class', label: 'Sinf bo\'yicha', icon: BookOpen },
                        { value: 'group', label: 'Guruh bo\'yicha', icon: UsersRound },
                        { value: 'individual', label: 'Individual', icon: User },
                      ] as const
                    ).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setParentMode(value)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-colors ${
                          parentMode === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Sinf bo'yicha */}
                  {parentMode === 'class' && (
                    <div className="space-y-3">
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sinf tanlang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classesData.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {c.parents.length} ta ota-ona
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedClass && (
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{selectedClass.name}</span>
                              {' '}— {selectedClass.studentCount} o'quvchi,{' '}
                              <span className="font-medium text-primary">{selectedClass.parents.length} ota-ona</span>
                            </span>
                          </div>
                          <Button size="sm" className="w-full" onClick={handleSelectClass}>
                            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                            {selectedClass.name} ota-onalarini qo'shish
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full" onClick={handleSelectAllParents}>
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Barcha ota-onalarni qo'shish ({parentsData.length} ta)
                      </Button>
                    </div>
                  )}

                  {/* Guruh bo'yicha */}
                  {parentMode === 'group' && (
                    <div className="space-y-3">
                      <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Guruh tanlang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groupsData.map(g => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name} — {g.parents.length} ta ota-ona
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedGroup && (
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{selectedGroup.name}</span>
                              {' '}— {selectedGroup.studentCount} o'quvchi,{' '}
                              <span className="font-medium text-primary">{selectedGroup.parents.length} ota-ona</span>
                            </span>
                          </div>
                          <Button size="sm" className="w-full" onClick={handleSelectGroup}>
                            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                            {selectedGroup.name} ota-onalarini qo'shish
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full" onClick={handleSelectAllParents}>
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Barcha ota-onalarni qo'shish ({parentsData.length} ta)
                      </Button>
                    </div>
                  )}

                  {/* Individual */}
                  {parentMode === 'individual' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Ota-ona yoki o'quvchi nomi..."
                          value={parentSearch}
                          onChange={e => setParentSearch(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-muted-foreground">
                          {filteredParents.length} ta natija
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => addUsers(filteredParents.map(p => p.userId))}
                          >
                            Barchasini belgilash
                          </button>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                            onClick={() =>
                              setSelectedUserIds(prev => {
                                const next = new Set(prev)
                                filteredParents.forEach(p => next.delete(p.userId))
                                return next
                              })
                            }
                          >
                            Bekor qilish
                          </button>
                        </div>
                      </div>
                      <div className="h-[260px] rounded-md border overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {filteredParents.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                              Natija topilmadi
                            </p>
                          ) : (
                            filteredParents.map(p => (
                              <CheckableItem
                                key={p.userId}
                                id={p.userId}
                                checked={selectedUserIds.has(p.userId)}
                                onToggle={toggleUser}
                                name={p.name}
                                sub={p.studentInfo}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* ── Staff/Teacher Tab ─────────────────────────────────── */}
                <TabsContent value="staff" className="space-y-4 mt-0">
                  {/* Quick select buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 justify-start"
                      onClick={handleSelectAllTeachers}
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                      Barcha o'qituvchilar
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {teachersData.length}
                      </Badge>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 justify-start"
                      onClick={handleSelectAllStaff}
                    >
                      <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                      Barcha xodimlar
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {staffData.length}
                      </Badge>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 flex items-center gap-1.5 justify-start"
                      onClick={handleSelectAllStaffTeachers}
                    >
                      <Users className="h-3.5 w-3.5 text-green-600" />
                      Barchasini qo'shish (xodim + o'qituvchi)
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {teachersData.length + staffData.length}
                      </Badge>
                    </Button>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Yoki individual tanlang:</p>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Ism bo'yicha qidirish..."
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {combinedList.length} ta natija
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => addUsers(combinedList.map(i => i.userId))}
                        >
                          Barchasini belgilash
                        </button>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                          onClick={() =>
                            setSelectedUserIds(prev => {
                              const next = new Set(prev)
                              combinedList.forEach(i => next.delete(i.userId))
                              return next
                            })
                          }
                        >
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                    <div className="h-[220px] rounded-md border overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {combinedList.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground py-8">
                            Natija topilmadi
                          </p>
                        ) : (
                          combinedList.map(item => (
                            <label
                              key={item.userId}
                              htmlFor={`chk-${item.userId}`}
                              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                selectedUserIds.has(item.userId)
                                  ? 'border-primary/50 bg-primary/5'
                                  : 'border-transparent hover:border-border hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={`chk-${item.userId}`}
                                checked={selectedUserIds.has(item.userId)}
                                onCheckedChange={() => toggleUser(item.userId)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium leading-none">{item.name}</p>
                                  <Badge
                                    variant={item.type === 'teacher' ? 'default' : 'secondary'}
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {item.type === 'teacher' ? "O'qituvchi" : 'Xodim'}
                                  </Badge>
                                </div>
                                {item.sub && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {item.sub}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Message Composition (2 cols) ────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected recipients preview */}
          <Card className={selectedCount > 0 ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="pt-4 pb-4">
              {selectedCount === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">Hali qabul qiluvchi tanlanmagan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {selectedCount} ta qabul qiluvchi
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(new Set())}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Barchasini olib tashlash
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNames.map(name => {
                      const uid = Array.from(selectedUserIds).find(id => nameMap.get(id) === name)
                      return uid ? (
                        <RecipientBadge key={uid} name={name} onRemove={() => removeUser(uid)} />
                      ) : null
                    })}
                    {selectedCount > 5 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{selectedCount - 5} ta boshqa
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Xabar matni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm">
                  Mavzu <span className="text-muted-foreground font-normal">(ixtiyoriy)</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Xabar mavzusi..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm">
                  Xabar matni <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Xabar matnini kiriting..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="min-h-[160px] resize-none"
                  maxLength={5000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{content.length}/5000 belgi</span>
                  {content.length > 4500 && (
                    <span className="text-orange-500">Limit yaqinlashmoqda</span>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isPending || selectedCount === 0 || !content.trim()}
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Xabar Yuborish
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs bg-white/20 text-white">
                        {selectedCount} ta
                      </Badge>
                    )}
                  </>
                )}
              </Button>

              {selectedCount === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Yuborish uchun kamida bitta qabul qiluvchi tanlang
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
