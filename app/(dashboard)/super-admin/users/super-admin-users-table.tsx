'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Building2, Mail, Phone } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV } from '@/lib/export'
import { SortableHeader } from '@/components/sortable-header'

interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
  tenant: {
    id: string
    name: string
    slug: string
  } | null
  student: {
    id: string
    studentCode: string
  } | null
  teacher: {
    id: string
    teacherCode: string
  } | null
}

export function SuperAdminUsersTable({ users }: { users: User[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(u => u.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(uid => uid !== id))
    }
  }

  const handleExport = () => {
    const selectedUsers = users.filter(u => selectedIds.includes(u.id))
    const formatted = selectedUsers.map(user => ({
      'Ism': user.fullName,
      'Email': user.email,
      'Telefon': user.phone || '',
      'Maktab': user.tenant?.name || 'N/A',
      'Rol': user.role,
      'Status': user.isActive ? 'Faol' : 'Nofaol',
      'Oxirgi kirish': user.lastLogin ? new Date(user.lastLogin).toLocaleString('uz-UZ') : 'Hech qachon',
      'Qo\'shilgan': new Date(user.createdAt).toLocaleDateString('uz-UZ'),
      'O\'quvchi kodi': user.student?.studentCode || '',
      'O\'qituvchi kodi': user.teacher?.teacherCode || '',
    }))
    exportToCSV(formatted, 'super-admin-users')
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-red-600">Super Admin</Badge>
      case 'ADMIN':
        return <Badge className="bg-purple-600">Admin</Badge>
      case 'TEACHER':
        return <Badge className="bg-blue-600">O'qituvchi</Badge>
      case 'PARENT':
        return <Badge className="bg-orange-600">Ota-ona</Badge>
      case 'STUDENT':
        return <Badge className="bg-green-600">O'quvchi</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left w-12">
                <Checkbox
                  checked={selectedIds.length === users.length && users.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-4 text-left text-sm font-medium">
                <SortableHeader label="Ism" column="fullName" />
              </th>
              <th className="p-4 text-left text-sm font-medium">
                <SortableHeader label="Maktab" column="tenant" />
              </th>
              <th className="p-4 text-left text-sm font-medium">
                <SortableHeader label="Rol" column="role" />
              </th>
              <th className="p-4 text-left text-sm font-medium">Bog'lanish</th>
              <th className="p-4 text-left text-sm font-medium">
                <SortableHeader label="Oxirgi kirish" column="lastLogin" />
              </th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
              <th className="p-4 text-left text-sm font-medium">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="p-4">
                  <Checkbox
                    checked={selectedIds.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                  />
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium">{user.fullName}</div>
                    {user.student && (
                      <div className="text-xs text-muted-foreground">
                        O'quvchi: {user.student.studentCode}
                      </div>
                    )}
                    {user.teacher && (
                      <div className="text-xs text-muted-foreground">
                        O'qituvchi: {user.teacher.teacherCode}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {user.tenant ? (
                    <Link 
                      href={`/super-admin/tenants/${user.tenant.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{user.tenant.name}</div>
                        <div className="text-xs text-muted-foreground">@{user.tenant.slug}</div>
                      </div>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Super Admin</span>
                  )}
                </td>
                <td className="p-4">
                  {getRoleBadge(user.role)}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('uz-UZ')
                      : <span className="text-muted-foreground">Hech qachon</span>
                    }
                  </div>
                  {user.lastLogin && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleTimeString('uz-UZ')}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {user.tenant && (
                      <Link href={`/super-admin/tenants/${user.tenant.id}`}>
                        <Button variant="ghost" size="sm" title="Maktabni ko'rish">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExport={handleExport}
        entityName="foydalanuvchi"
        showDelete={false}
        showStatusChange={false}
      />
    </>
  )
}

