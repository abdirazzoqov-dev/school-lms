'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Pencil } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'
import { DeactivateButton } from '@/components/deactivate-button'
import { deleteStudent, deactivateStudent, bulkDeleteStudents, bulkChangeStudentStatus } from '@/app/actions/student'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV, formatStudentsForExport } from '@/lib/export'

interface Student {
  id: string
  studentCode: string
  dateOfBirth: Date
  gender: string
  address: string | null
  status: string
  trialEnabled: boolean
  trialEndDate: Date | null
  user: {
    fullName: string
    email: string | null
    phone: string | null
  } | null
  class: {
    id: string
    name: string
  } | null
  parents: Array<{
    parent: {
      user: {
        fullName: string
        phone: string | null
      }
    }
  }>
}

export function StudentsTable({ students }: { students: Student[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map(s => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    }
  }

  const handleExport = () => {
    const selectedStudents = students.filter(s => selectedIds.includes(s.id))
    const formatted = formatStudentsForExport(selectedStudents)
    exportToCSV(formatted, 'students')
  }

  const handleBulkDelete = async () => {
    await bulkDeleteStudents(selectedIds)
    setSelectedIds([])
  }

  const handleBulkStatusChange = async (status: string) => {
    await bulkChangeStudentStatus(selectedIds, status as any)
    setSelectedIds([])
  }

  const statusOptions = [
    { label: 'Faol', value: 'ACTIVE' },
    { label: 'Bitirgan', value: 'GRADUATED' },
    { label: 'Chiqarilgan', value: 'EXPELLED' },
  ]

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left w-12">
                <Checkbox
                  checked={selectedIds.length === students.length && students.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
              <th className="p-4 text-left text-sm font-medium">Kodi</th>
              <th className="p-4 text-left text-sm font-medium">Sinf</th>
              <th className="p-4 text-left text-sm font-medium">Ota-ona</th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
              <th className="p-4 text-left text-sm font-medium">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-muted/50">
                <td className="p-4">
                  <Checkbox
                    checked={selectedIds.includes(student.id)}
                    onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                  />
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium">{student.user?.fullName || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{student.user?.email}</div>
                  </div>
                </td>
                <td className="p-4">
                  <code className="text-sm">{student.studentCode}</code>
                </td>
                <td className="p-4">
                  {student.class ? (
                    <Link 
                      href={`/admin/classes/${student.class.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {student.class.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4">
                  {student.parents[0] ? (
                    <div className="text-sm">
                      <div>{student.parents[0].parent.user.fullName}</div>
                      <div className="text-muted-foreground">{student.parents[0].parent.user.phone}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <Badge variant={
                      student.status === 'ACTIVE' ? 'default' : 
                      student.status === 'GRADUATED' ? 'secondary' : 
                      'destructive'
                    }>
                      {student.status === 'ACTIVE' ? 'Faol' :
                       student.status === 'GRADUATED' ? 'Bitirgan' : 
                       'Chiqarilgan'}
                    </Badge>
                    {student.trialEnabled && student.trialEndDate && (() => {
                      const now = new Date()
                      const endDate = new Date(student.trialEndDate)
                      const isExpired = endDate < now
                      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <Badge variant={isExpired ? 'destructive' : 'outline'} className="text-xs">
                          {isExpired ? '⏰ Sinov tugagan' : `⏱️ ${daysLeft} kun`}
                        </Badge>
                      )
                    })()}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/students/${student.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/students/${student.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {student.status === 'ACTIVE' && (
                      <DeactivateButton
                        itemId={student.id}
                        itemName={student.user?.fullName || 'N/A'}
                        itemType="student"
                        onDeactivate={deactivateStudent}
                      />
                    )}
                    <DeleteButton
                      itemId={student.id}
                      itemName={student.user?.fullName || 'N/A'}
                      itemType="student"
                      onDelete={deleteStudent}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {students.map((student) => (
          <div key={student.id} className="rounded-lg border bg-card p-4 space-y-3">
            {/* Header with checkbox and name */}
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedIds.includes(student.id)}
                onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{student.user?.fullName || 'N/A'}</h3>
                <p className="text-xs text-muted-foreground truncate">{student.user?.email}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link href={`/admin/students/${student.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href={`/admin/students/${student.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Kodi</p>
                <code className="text-xs font-mono">{student.studentCode}</code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sinf</p>
                {student.class ? (
                  <Link 
                    href={`/admin/classes/${student.class.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {student.class.name}
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Ota-ona</p>
                {student.parents[0] ? (
                  <div className="text-xs">
                    <div className="font-medium">{student.parents[0].parent.user.fullName}</div>
                    <div className="text-muted-foreground">{student.parents[0].parent.user.phone}</div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <div className="flex flex-wrap gap-1">
                <Badge variant={
                  student.status === 'ACTIVE' ? 'default' : 
                  student.status === 'GRADUATED' ? 'secondary' : 
                  'destructive'
                } className="text-[10px]">
                  {student.status === 'ACTIVE' ? 'Faol' :
                   student.status === 'GRADUATED' ? 'Bitirgan' : 
                   'Chiqarilgan'}
                </Badge>
                {student.trialEnabled && student.trialEndDate && (() => {
                  const now = new Date()
                  const endDate = new Date(student.trialEndDate)
                  const isExpired = endDate < now
                  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <Badge variant={isExpired ? 'destructive' : 'outline'} className="text-[10px]">
                      {isExpired ? '⏰ Sinov tugagan' : `⏱️ ${daysLeft} kun`}
                    </Badge>
                  )
                })()}
              </div>
              <div className="flex gap-1">
                {student.status === 'ACTIVE' && (
                  <DeactivateButton
                    itemId={student.id}
                    itemName={student.user?.fullName || 'N/A'}
                    itemType="student"
                    onDeactivate={deactivateStudent}
                  />
                )}
                <DeleteButton
                  itemId={student.id}
                  itemName={student.user?.fullName || 'N/A'}
                  itemType="student"
                  onDelete={deleteStudent}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExport={handleExport}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        statusOptions={statusOptions}
        entityName="o'quvchi"
      />
    </>
  )
}

