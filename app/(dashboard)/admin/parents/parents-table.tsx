'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  X, 
  Mail, 
  Phone, 
  Users, 
  GraduationCap,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { deleteParent } from '@/app/actions/parent'
import { useAdminPermissions } from '@/components/admin/permissions-provider'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Parent {
  id: string
  user: {
    fullName: string
    email: string
    phone: string | null
    isActive: boolean
  } | null
  students: {
    student: {
      id: string
      user: {
        fullName: string
      } | null
      class: {
        name: string
      } | null
    }
  }[]
  occupation?: string | null
  workAddress?: string | null
}

interface Class {
  id: string
  name: string
}

interface SearchParams {
  search?: string
  class?: string
  status?: string
}

interface ParentsTableProps {
  parents: Parent[]
  classes: Class[]
  searchParams: SearchParams
}

export function ParentsTable({ parents, classes, searchParams }: ParentsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()
  const { toast } = useToast()
  const { can } = useAdminPermissions()
  const canRead = can('parents', 'READ')
  const canCreate = can('parents', 'CREATE')
  const canUpdate = can('parents', 'UPDATE')
  const canDelete = can('parents', 'DELETE')

  const [search, setSearch] = useState(searchParams.search || '')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; parent: Parent | null }>({
    open: false,
    parent: null
  })
  const [deleting, setDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // Reset to page 1 when parents list changes (search/filter applied)
  useEffect(() => {
    setCurrentPage(1)
  }, [parents.length])

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = () => {
    updateSearchParams('search', search)
  }

  const clearFilters = () => {
    setSearch('')
    router.push(pathname)
  }

  const handleDelete = async () => {
    if (!deleteDialog.parent) return

    setDeleting(true)
    try {
      const result = await deleteParent(deleteDialog.parent.id)
      
      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: result.message || 'Ota-ona o\'chirildi',
        })
        setDeleteDialog({ open: false, parent: null })
        router.refresh()
      } else {
        toast({
          title: 'Xato!',
          description: result.error || 'Ota-onani o\'chirishda xatolik',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const hasActiveFilters = searchParams.search || searchParams.class || searchParams.status

  // Pagination
  const totalPages = Math.ceil(parents.length / PAGE_SIZE)
  const paginatedParents = parents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Qarindosh nomi yoki telefon bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="default">
            Qidirish
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0.5 text-xs">
                {[searchParams.search, searchParams.class, searchParams.status]
                  .filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} size="sm">
              <X className="h-4 w-4 mr-1" />
              Tozalash
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sinf</label>
              <Select
                value={searchParams.class || 'all'}
                onValueChange={(value) => updateSearchParams('class', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha sinflar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha sinflar</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={searchParams.status || 'all'}
                onValueChange={(value) => updateSearchParams('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha statuslar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span>
          {' '}dan{' '}
          <span className="font-semibold text-foreground">{Math.min(currentPage * PAGE_SIZE, parents.length)}</span>
          {' '}gacha, jami{' '}
          <span className="font-semibold text-foreground">{parents.length}</span>
          {' '}ta natija
        </p>
        {totalPages > 1 && (
          <p className="text-xs">
            {currentPage}/{totalPages} sahifa
          </p>
        )}
      </div>

      {/* Table */}
      {parents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ota-onalar topilmadi</h3>
          <p className="text-muted-foreground mb-4">
            Hozircha ota-onalar ro'yxati bo'sh
          </p>
          {canCreate && (
            <Link href="/admin/parents/create">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Birinchi ota-onani qo'shish
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Ota-ona</TableHead>
                <TableHead>Aloqa</TableHead>
                <TableHead>Farzandlar</TableHead>
                <TableHead>Sinf</TableHead>
                <TableHead>Ish joyi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParents.map((parent, index) => (
                <TableRow key={parent.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </TableCell>

                  {/* Parent Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(parent.user?.fullName || 'N/A')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{parent.user?.fullName || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {parent.occupation || 'Kasb ko\'rsatilmagan'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{parent.user?.email || 'N/A'}</span>
                      </div>
                      {parent.user?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{parent.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Children */}
                  <TableCell>
                    <div className="space-y-1">
                      {parent.students.length > 0 ? (
                        parent.students.map((sp) => (
                          <div
                            key={sp.student.id}
                            className="flex items-center gap-2"
                          >
                            <GraduationCap className="h-3 w-3 text-blue-500" />
                            <span className="text-sm">
                              {sp.student.user?.fullName || 'N/A'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Farzand biriktirilmagan
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Class */}
                  <TableCell>
                    <div className="space-y-1">
                      {parent.students.length > 0 ? (
                        parent.students.map((sp) => (
                          <Badge
                            key={sp.student.id}
                            variant="outline"
                            className="font-mono"
                          >
                            {sp.student.class?.name || 'Sinf yo\'q'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Workplace */}
                  <TableCell>
                    <p className="text-sm">
                      {parent.workAddress || '-'}
                    </p>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={parent.user?.isActive ? 'default' : 'secondary'}
                      className={
                        parent.user?.isActive
                          ? 'bg-green-500 hover:bg-green-600'
                          : ''
                      }
                    >
                      {parent.user?.isActive ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canRead && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/parents/${parent.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ko'rish
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canUpdate && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/parents/${parent.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Tahrirlash
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 cursor-pointer"
                              onSelect={(e) => {
                                e.preventDefault()
                                setDeleteDialog({ open: true, parent })
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              O'chirish
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Jami <span className="font-semibold text-foreground">{parents.length}</span> ta,{' '}
            <span className="font-semibold text-foreground">{PAGE_SIZE}</span> tadan ko'rsatilmoqda
          </p>
          <div className="flex items-center gap-1">
            {/* First */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            {/* Prev */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {getPageNumbers().map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-muted-foreground text-sm select-none">…</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-sm font-semibold"
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </Button>
              )
            )}

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* Last */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, parent: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{deleteDialog.parent?.user?.fullName}</strong> ota-onasini o'chirmoqdasiz.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-1">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Diqqat:
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Agar farzandlarga biriktirilgan bo'lsa, o'chirib bo'lmaydi</li>
                  <li>User akkaunt ham o'chiriladi</li>
                  <li>Bu amalni qaytarib bo'lmaydi!</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'O\'chirilmoqda...' : 'Ha, O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

