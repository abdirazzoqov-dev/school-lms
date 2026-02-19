'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil, MoreVertical, Trash2, UserX, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ResponsiveTableWrapper } from '@/components/responsive-table-wrapper'
import { deleteStaff } from '@/app/actions/staff'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminPermissions } from '@/components/admin/permissions-provider'

interface Staff {
  id: string
  staffCode: string
  position: string
  department: string | null
  monthlySalary: any
  user: {
    fullName: string
    email: string
    phone: string | null
    isActive: boolean
    avatar?: string | null
  }
  salaryPayments?: Array<{
    id: string
    amount: any
    paidAmount: any
    remainingAmount: any
    status: string
    type: string
  }>
}

export function StaffTable({ staff }: { staff: Staff[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { can } = useAdminPermissions()
  const canRead = can('staff', 'READ')
  const canCreate = can('staff', 'CREATE')
  const canUpdate = can('staff', 'UPDATE')
  const canDelete = can('staff', 'DELETE')
  const canBulkAction = canRead || canUpdate || canDelete

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(staff.map(s => s.id))
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

  const renderDesktopTable = () => (
    <div className="rounded-xl border-2 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-fixed">
          <thead className="border-b-2 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/30 dark:via-blue-950/30 dark:to-indigo-950/30">
            <tr>
              {canBulkAction && (
                <th className="p-3 text-left w-12">
                  <Checkbox
                    checked={selectedIds.length === staff.length && staff.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                </th>
              )}
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[250px]">Xodim</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[120px]">Kodi</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[150px]">Lavozim</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[120px]">Oylik Maosh</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[200px]">To'lov Holati</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white w-[100px]">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white dark:bg-gray-950">
            {staff.map((member, index) => (
              <tr 
                key={member.id} 
                className="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-950/20 dark:hover:to-blue-950/20 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {canBulkAction && (
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={(checked) => handleSelectOne(member.id, checked as boolean)}
                      className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                  </td>
                )}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg border-2 border-white">
                      {member.user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.user.avatar}
                          alt={member.user.fullName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">${member.user.fullName?.charAt(0) || '?'}</div>`
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {member.user.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {member.user.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{member.user.email}</div>
                      {!member.user.isActive && (
                        <Badge variant="destructive" className="text-[10px] mt-0.5">Deaktiv</Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <code className="text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 block truncate" title={member.staffCode}>
                    {member.staffCode}
                  </code>
                </td>
                <td className="p-3">
                  <span className="text-sm truncate block font-medium" title={member.position}>
                    {member.position}
                  </span>
                </td>
                <td className="p-3">
                  {member.monthlySalary ? (
                    <div className="text-sm">
                      <div className="font-semibold text-green-600">
                        {Number(member.monthlySalary).toLocaleString('uz-UZ')}
                      </div>
                      <div className="text-xs text-muted-foreground">so'm/oy</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Kiritilmagan</span>
                  )}
                </td>
                <td className="p-3">
                  {(() => {
                    if (!member.monthlySalary) {
                      return <span className="text-xs text-muted-foreground">-</span>
                    }

                    const monthlySalary = Number(member.monthlySalary)
                    const totalPaid = member.salaryPayments?.reduce(
                      (sum, payment) => sum + Number(payment.paidAmount || 0),
                      0
                    ) || 0
                    const percentage = monthlySalary > 0 ? Math.min((totalPaid / monthlySalary) * 100, 100) : 0

                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-cyan-600">
                            {totalPaid.toLocaleString('uz-UZ')} so'm
                          </span>
                          <span className="text-muted-foreground">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                        <div className="text-[10px] text-muted-foreground">
                          Qolgan: {(monthlySalary - totalPaid).toLocaleString('uz-UZ')} so'm
                        </div>
                      </div>
                    )
                  })()}
                </td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-950/50 dark:hover:to-blue-950/50"
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
                          href={`/admin/staff/${member.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span>Ko'rish</span>
                        </Link>
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/admin/staff/${member.id}/edit`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4 text-indigo-600" />
                            <span>Tahrirlash</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/admin/staff/${member.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <ShieldCheck className="h-4 w-4 text-purple-600" />
                            <span>Ruxsatlar</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={async () => {
                              if (confirm(`${member.user.fullName} ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi!`)) {
                                await deleteStaff(member.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>O'chirish</span>
                          </DropdownMenuItem>
                        </>
                      )}
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
      {staff.map((member, index) => (
        <div
          key={member.id} 
          className="relative overflow-hidden rounded-xl border-2 bg-white dark:bg-gray-950 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              {canBulkAction && (
                <Checkbox
                  checked={selectedIds.includes(member.id)}
                  onCheckedChange={(checked) => handleSelectOne(member.id, checked as boolean)}
                  className="mt-2 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
              )}
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg shrink-0 border-2 border-white">
                {member.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.user.avatar}
                    alt={member.user.fullName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">${member.user.fullName?.charAt(0) || '?'}</div>`
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {member.user.fullName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                  {member.user.fullName}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <code className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                    {member.staffCode}
                  </code>
                  {!member.user.isActive && (
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
                      className="h-9 w-9 p-0 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-950/50 dark:hover:to-blue-950/50"
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
                        href={`/admin/staff/${member.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span>Ko'rish</span>
                      </Link>
                    </DropdownMenuItem>
                    {canUpdate && (
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/admin/staff/${member.id}/edit`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 text-indigo-600" />
                          <span>Tahrirlash</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canUpdate && (
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/admin/staff/${member.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="h-4 w-4 text-purple-600" />
                          <span>Ruxsatlar</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={async () => {
                            if (confirm(`${member.user.fullName} ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi!`)) {
                              await deleteStaff(member.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>O'chirish</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-3 py-3 border-y text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Lavozim</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{member.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Bo'lim</p>
                  <p className="text-gray-900 dark:text-white">{member.department || '-'}</p>
                </div>
              </div>

              {/* Oylik Maosh va Progress */}
              {member.monthlySalary ? (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-muted-foreground">Oylik Maosh</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {Number(member.monthlySalary).toLocaleString('uz-UZ')} so'm
                    </span>
                  </div>

                  {(() => {
                    const monthlySalary = Number(member.monthlySalary)
                    const totalPaid = member.salaryPayments?.reduce(
                      (sum, payment) => sum + Number(payment.paidAmount || 0),
                      0
                    ) || 0
                    const percentage = monthlySalary > 0 ? Math.min((totalPaid / monthlySalary) * 100, 100) : 0

                    return (
                      <div className="space-y-1.5 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
                            <span className="font-medium text-cyan-600">To'langan</span>
                          </div>
                          <span className="font-bold text-cyan-600">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2.5"
                        />
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{totalPaid.toLocaleString('uz-UZ')} so'm</span>
                          <span>Qolgan: {(monthlySalary - totalPaid).toLocaleString('uz-UZ')} so'm</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Oylik maosh kiritilmagan
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <ResponsiveTableWrapper
      desktopContent={renderDesktopTable()}
      mobileContent={renderMobileCards()}
    />
  )
}
