'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil, MoreVertical, Trash2, UserX } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'
import { DeactivateButton } from '@/components/deactivate-button'
import { deleteTeacher, deactivateTeacher, bulkDeleteTeachers, bulkDeactivateTeachers } from '@/app/actions/teacher'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV, formatTeachersForExport } from '@/lib/export'
import { ResponsiveTableWrapper } from '@/components/responsive-table-wrapper'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Teacher {
  id: string
  teacherCode: string
  specialization: string
  experienceYears: number | null
  user: {
    fullName: string
    email: string
    phone: string | null
    isActive: boolean
  }
  classSubjects?: Array<{
    class: {
      id: string
      name: string
    }
  }>
}

export function TeachersTable({ teachers }: { teachers: Teacher[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(teachers.map(t => t.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(tid => tid !== id))
    }
  }

  const handleExport = () => {
    const selectedTeachers = teachers.filter(t => selectedIds.includes(t.id))
    const formatted = formatTeachersForExport(selectedTeachers)
    exportToCSV(formatted, 'teachers')
  }

  const handleBulkDelete = async () => {
    await bulkDeleteTeachers(selectedIds)
    setSelectedIds([])
  }

  const handleBulkDeactivate = async () => {
    await bulkDeactivateTeachers(selectedIds)
    setSelectedIds([])
  }

  const renderDesktopTable = () => (
    <div className="rounded-xl border-2 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-fixed">
          <thead className="border-b-2 bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-red-950/30">
            <tr>
              <th className="p-3 text-left w-12">
                <Checkbox
                  checked={selectedIds.length === teachers.length && teachers.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
              </th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[250px]">O'qituvchi</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[150px]">Kodi</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[150px]">Mutaxassislik</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[100px]">Tajriba</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[150px]">Sinflar</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[100px]">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white dark:bg-gray-950">
            {teachers.map((teacher, index) => (
              <tr 
                key={teacher.id} 
                className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedIds.includes(teacher.id)}
                    onCheckedChange={(checked) => handleSelectOne(teacher.id, checked as boolean)}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shrink-0">
                      {teacher.user.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {teacher.user.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{teacher.user.email}</div>
                      {!teacher.user.isActive && (
                        <Badge variant="destructive" className="text-[10px] mt-0.5">Deaktiv</Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <code className="text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-400 block truncate" title={teacher.teacherCode}>
                    {teacher.teacherCode}
                  </code>
                </td>
                <td className="p-3">
                  <span className="text-sm truncate block" title={teacher.specialization}>
                    {teacher.specialization}
                  </span>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    {teacher.experienceYears} yil
                  </Badge>
                </td>
                <td className="p-3">
                  {(() => {
                    const classesMap = new Map()
                    teacher.classSubjects?.forEach(cs => {
                      if (!classesMap.has(cs.class.id)) {
                        classesMap.set(cs.class.id, cs.class)
                      }
                    })
                    const classes = Array.from(classesMap.values())

                    return classes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {classes.slice(0, 2).map((cls) => (
                          <Link 
                            key={cls.id}
                            href={`/admin/classes/${cls.id}`}
                            className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            {cls.name}
                          </Link>
                        ))}
                        {classes.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{classes.length - 2}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )
                  })()}
                </td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/50 dark:hover:to-pink-950/50"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Harakatlar menusi</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="font-semibold">Harakatlar</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/admin/teachers/${teacher.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span>Ko'rish</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/admin/teachers/${teacher.id}/edit`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 text-indigo-600" />
                          <span>Tahrirlash</span>
                        </Link>
                      </DropdownMenuItem>
                      {teacher.user.isActive && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer text-orange-600 focus:text-orange-600"
                            onClick={async () => {
                              if (confirm(`${teacher.user.fullName} ni deaktivatsiya qilishni xohlaysizmi?`)) {
                                await deactivateTeacher(teacher.id)
                              }
                            }}
                          >
                            <UserX className="h-4 w-4" />
                            <span>Deaktivatsiya</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={async () => {
                          if (confirm(`${teacher.user.fullName} ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi!`)) {
                            await deleteTeacher(teacher.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>O'chirish</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMobileCards = () => (
    <div className="space-y-4">
      {teachers.map((teacher, index) => {
        const classesMap = new Map()
        teacher.classSubjects?.forEach(cs => {
          if (!classesMap.has(cs.class.id)) {
            classesMap.set(cs.class.id, cs.class)
          }
        })
        const classes = Array.from(classesMap.values())

        return (
          <div
            key={teacher.id} 
            className="relative overflow-hidden rounded-xl border-2 bg-white dark:bg-gray-950 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-600 to-red-600" />
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.includes(teacher.id)}
                  onCheckedChange={(checked) => handleSelectOne(teacher.id, checked as boolean)}
                  className="mt-2 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                  {teacher.user.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                    {teacher.user.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{teacher.user.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="text-xs font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      {teacher.teacherCode}
                    </code>
                    {!teacher.user.isActive && (
                      <Badge variant="destructive" className="text-[10px]">Deaktiv</Badge>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/50 dark:hover:to-pink-950/50"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Harakatlar menusi</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="font-semibold">Harakatlar</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/admin/teachers/${teacher.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span>Ko'rish</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/admin/teachers/${teacher.id}/edit`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 text-indigo-600" />
                          <span>Tahrirlash</span>
                        </Link>
                      </DropdownMenuItem>
                      {teacher.user.isActive && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer text-orange-600 focus:text-orange-600"
                            onClick={async () => {
                              if (confirm(`${teacher.user.fullName} ni deaktivatsiya qilishni xohlaysizmi?`)) {
                                await deactivateTeacher(teacher.id)
                              }
                            }}
                          >
                            <UserX className="h-4 w-4" />
                            <span>Deaktivatsiya</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={async () => {
                          if (confirm(`${teacher.user.fullName} ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi!`)) {
                            await deleteTeacher(teacher.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>O'chirish</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Mutaxassislik</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{teacher.specialization}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tajriba</p>
                  <Badge variant="secondary" className="text-xs">
                    {teacher.experienceYears} yil
                  </Badge>
                </div>
                {classes.length > 0 && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Sinflar</p>
                    <div className="flex flex-wrap gap-1">
                      {classes.map((cls) => (
                        <Link 
                          key={cls.id}
                          href={`/admin/classes/${cls.id}`}
                          className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          {cls.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <ResponsiveTableWrapper
        desktopContent={renderDesktopTable()}
        mobileContent={renderMobileCards()}
      />

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExport={handleExport}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkDeactivate}
        statusOptions={[]}
        entityName="o'qituvchi"
      />
    </>
  )
}
