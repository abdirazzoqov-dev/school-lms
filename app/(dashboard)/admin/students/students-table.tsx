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
      {/* Desktop Table View with Modern Design */}
      <div className="hidden md:block rounded-xl border-2 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max table-fixed">
            <thead className="border-b-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
              <tr>
                <th className="p-3 text-left w-12">
                  <Checkbox
                    checked={selectedIds.length === students.length && students.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[250px]">O'quvchi</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[150px]">Kodi</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[100px]">Sinf</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[180px]">Ota-ona</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[120px]">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[160px]">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white dark:bg-gray-950">
              {students.map((student, index) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(student.id)}
                      onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shrink-0">
                        {student.user?.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {student.user?.fullName || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{student.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <code className="text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 block truncate" title={student.studentCode}>
                      {student.studentCode}
                    </code>
                  </td>
                  <td className="p-3">
                    {student.class ? (
                      <Link 
                        href={`/admin/classes/${student.class.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline transition-colors"
                      >
                        {student.class.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {student.parents[0] ? (
                      <div className="text-xs min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate" title={student.parents[0].parent.user.fullName}>
                          {student.parents[0].parent.user.fullName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {student.parents[0].parent.user.phone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant={
                          student.status === 'ACTIVE' ? 'default' : 
                          student.status === 'GRADUATED' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          student.status === 'ACTIVE' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs whitespace-nowrap' 
                            : student.status === 'GRADUATED'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-xs whitespace-nowrap'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-xs whitespace-nowrap'
                        }
                      >
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
                          <Badge 
                            variant={isExpired ? 'destructive' : 'outline'} 
                            className="text-[10px] whitespace-nowrap"
                          >
                            {isExpired ? '⏰ Tugagan' : `⏱️ ${daysLeft} kun`}
                          </Badge>
                        )
                      })()}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/students/${student.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/admin/students/${student.id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
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
      </div>

      {/* Mobile Card View with Modern Design */}
      <div className="md:hidden space-y-4">
        {students.map((student, index) => (
          <div 
            key={student.id} 
            className="relative overflow-hidden rounded-xl border-2 bg-white dark:bg-gray-950 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600" />
            <div className="p-4 space-y-4">
              {/* Header with Avatar, Name and Actions */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.includes(student.id)}
                  onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                  className="mt-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                  {student.user?.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                    {student.user?.fullName || 'N/A'}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{student.user?.email}</p>
                  <code className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mt-1 inline-block">
                    {student.studentCode}
                  </code>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/admin/students/${student.id}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/students/${student.id}/edit`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Info Grid with Icons */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Sinf</p>
                  {student.class ? (
                    <Link 
                      href={`/admin/classes/${student.class.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-block"
                    >
                      {student.class.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Ota-ona</p>
                  {student.parents[0] ? (
                    <div className="text-xs">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {student.parents[0].parent.user.fullName}
                      </div>
                      <div className="text-muted-foreground">
                        {student.parents[0].parent.user.phone}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={
                      student.status === 'ACTIVE' ? 'default' : 
                      student.status === 'GRADUATED' ? 'secondary' : 
                      'destructive'
                    }
                    className={
                      student.status === 'ACTIVE' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : student.status === 'GRADUATED'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                        : 'bg-gradient-to-r from-red-500 to-rose-600'
                    }
                  >
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
                      <Badge 
                        variant={isExpired ? 'destructive' : 'outline'} 
                        className="text-xs"
                      >
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

