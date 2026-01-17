'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'
import { DeactivateButton } from '@/components/deactivate-button'
import { deleteTeacher, deactivateTeacher, bulkDeleteTeachers, bulkDeactivateTeachers } from '@/app/actions/teacher'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV, formatTeachersForExport } from '@/lib/export'
import { ResponsiveTableWrapper } from '@/components/responsive-table-wrapper'
import { Card, CardContent } from '@/components/ui/card'

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
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="p-4 text-left w-12">
              <Checkbox
                checked={selectedIds.length === teachers.length && teachers.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </th>
            <th className="p-4 text-left text-sm font-medium">O'qituvchi</th>
            <th className="p-4 text-left text-sm font-medium">Kodi</th>
            <th className="p-4 text-left text-sm font-medium">Mutaxassislik</th>
            <th className="p-4 text-left text-sm font-medium">Tajriba</th>
            <th className="p-4 text-left text-sm font-medium">Sinflar</th>
            <th className="p-4 text-left text-sm font-medium">Harakatlar</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {teachers.map((teacher) => (
            <tr key={teacher.id} className="hover:bg-muted/50">
              <td className="p-4">
                <Checkbox
                  checked={selectedIds.includes(teacher.id)}
                  onCheckedChange={(checked) => handleSelectOne(teacher.id, checked as boolean)}
                />
              </td>
              <td className="p-4">
                <div>
                  <div className="font-medium">{teacher.user.fullName}</div>
                  <div className="text-sm text-muted-foreground">{teacher.user.email}</div>
                  <div className="text-sm text-muted-foreground">{teacher.user.phone}</div>
                </div>
              </td>
              <td className="p-4">
                <code className="text-sm">{teacher.teacherCode}</code>
              </td>
              <td className="p-4">{teacher.specialization}</td>
              <td className="p-4">{teacher.experienceYears} yil</td>
              <td className="p-4">
                {(() => {
                  const classesMap = new Map()
                  teacher.classSubjects?.forEach(cs => {
                    if (!classesMap.has(cs.class.id)) {
                      classesMap.set(cs.class.id, cs.class)
                    }
                  })
                  const classes = Array.from(classesMap.values())

                  return classes.length > 0 ? (
                    <div className="space-y-1">
                      {classes.map((cls) => (
                        <Link 
                          key={cls.id}
                          href={`/admin/classes/${cls.id}`}
                          className="block text-blue-600 hover:underline text-sm"
                        >
                          {cls.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )
                })()}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {!teacher.user.isActive && (
                    <Badge variant="destructive" className="mr-2">Deaktiv</Badge>
                  )}
                  <Link href={`/admin/teachers/${teacher.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/teachers/${teacher.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  {teacher.user.isActive && (
                    <DeactivateButton
                      itemId={teacher.id}
                      itemName={teacher.user.fullName}
                      itemType="teacher"
                      onDeactivate={deactivateTeacher}
                    />
                  )}
                  <DeleteButton
                    itemId={teacher.id}
                    itemName={teacher.user.fullName}
                    itemType="teacher"
                    onDelete={deleteTeacher}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderMobileCards = () => (
    <div className="space-y-3">
      {teachers.map((teacher) => {
        const classesMap = new Map()
        teacher.classSubjects?.forEach(cs => {
          if (!classesMap.has(cs.class.id)) {
            classesMap.set(cs.class.id, cs.class)
          }
        })
        const classes = Array.from(classesMap.values())

        return (
          <Card key={teacher.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedIds.includes(teacher.id)}
                    onCheckedChange={(checked) => handleSelectOne(teacher.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base mb-1">{teacher.user.fullName}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {teacher.teacherCode}
                      </code>
                      {!teacher.user.isActive && (
                        <Badge variant="destructive" className="text-xs">Deaktiv</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[80px]">Email:</span>
                        <span className="break-all">{teacher.user.email}</span>
                      </div>
                      {teacher.user.phone && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[80px]">Telefon:</span>
                          <span>{teacher.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[80px]">Fan:</span>
                        <span>{teacher.specialization}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[80px]">Tajriba:</span>
                        <span>{teacher.experienceYears} yil</span>
                      </div>
                      {classes.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[80px]">Sinflar:</span>
                          <div className="flex flex-wrap gap-1">
                            {classes.map((cls) => (
                              <Link 
                                key={cls.id}
                                href={`/admin/classes/${cls.id}`}
                                className="text-blue-600 hover:underline"
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
              </div>
              <div className="flex items-center gap-2 pt-3 border-t">
                <Link href={`/admin/teachers/${teacher.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ko'rish
                  </Button>
                </Link>
                <Link href={`/admin/teachers/${teacher.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Pencil className="h-4 w-4 mr-2" />
                    Tahrirlash
                  </Button>
                </Link>
                {teacher.user.isActive && (
                  <DeactivateButton
                    itemId={teacher.id}
                    itemName={teacher.user.fullName}
                    itemType="teacher"
                    onDeactivate={deactivateTeacher}
                  />
                )}
                <DeleteButton
                  itemId={teacher.id}
                  itemName={teacher.user.fullName}
                  itemType="teacher"
                  onDelete={deleteTeacher}
                />
              </div>
            </CardContent>
          </Card>
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
