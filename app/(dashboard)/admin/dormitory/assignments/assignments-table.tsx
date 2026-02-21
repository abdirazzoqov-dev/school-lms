'use client'

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
import { Users, Eye, LogOut, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { checkOutStudent } from '@/app/actions/dormitory'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { useAdminPermissions } from '@/components/admin/permissions-provider'

interface Assignment {
  id: string
  status: string
  checkInDate: Date
  checkOutDate: Date | null
  monthlyFee: any
  student: {
    id: string
    studentCode: string
    gender: 'MALE' | 'FEMALE'
    user: {
      fullName: string
    } | null
    class: {
      name: string
    } | null
  }
  room: {
    roomNumber: string
    building: {
      name: string
      code: string
    }
  }
  bed: {
    bedNumber: string
  }
  assignedBy: {
    fullName: string
  } | null
}

interface AssignmentsTableProps {
  assignments: Assignment[]
}

export function AssignmentsTable({ assignments }: AssignmentsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { can } = useAdminPermissions()
  const canRead   = can('dormitory', 'READ')
  const canUpdate = can('dormitory', 'UPDATE')

  const handleCheckOut = async (assignmentId: string) => {
    if (!confirm('O\'quvchini yotoqxonadan chiqarishni tasdiqlaysizmi?')) return

    setProcessingId(assignmentId)

    const result = await checkOutStudent(assignmentId)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'O\'quvchi yotoqxonadan chiqarildi',
      })
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: result.error,
      })
    }

    setProcessingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Faol</Badge>
      case 'CHECKED_OUT':
        return <Badge variant="outline" className="text-orange-600">Chiqdi</Badge>
      case 'SUSPENDED':
        return <Badge variant="destructive">To\'xtatilgan</Badge>
      case 'MOVED':
        return <Badge variant="secondary">Ko\'chirildi</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Joylashtirishlar yo'q</h3>
        <p className="text-muted-foreground mb-4">
          Hozircha hech kim yotoqxonaga joylashtirilmagan
        </p>
        {can('dormitory', 'CREATE') && (
          <Link href="/admin/dormitory/assign">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Birinchi joylashtirishni qilish
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>O'quvchi</TableHead>
            <TableHead>Xona va Joy</TableHead>
            <TableHead>Kirish Sanasi</TableHead>
            <TableHead>Oylik To'lov</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment, index) => (
            <TableRow key={assignment.id} className="hover:bg-muted/50">
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-semibold">
                    {assignment.student.user?.fullName || 'N/A'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {assignment.student.studentCode}
                    </p>
                    {assignment.student.class && (
                      <Badge variant="outline" className="text-xs">
                        {assignment.student.class.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-semibold font-mono">
                    Xona {assignment.room.roomNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.room.building.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joy #{assignment.bed.bedNumber}
                  </p>
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <p className="text-sm">
                    {new Date(assignment.checkInDate).toLocaleDateString('uz-UZ')}
                  </p>
                  {assignment.checkOutDate && (
                    <p className="text-xs text-muted-foreground">
                      Chiqdi: {new Date(assignment.checkOutDate).toLocaleDateString('uz-UZ')}
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <p className="font-semibold">
                  {Number(assignment.monthlyFee).toLocaleString()} so'm
                </p>
                <p className="text-xs text-muted-foreground">oyiga</p>
              </TableCell>

              <TableCell>
                {getStatusBadge(assignment.status)}
              </TableCell>

              <TableCell>
                {(canRead || canUpdate) && (
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
                          <Link href={`/admin/students/${assignment.student.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            O'quvchini ko'rish
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {canUpdate && assignment.status === 'ACTIVE' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => handleCheckOut(assignment.id)}
                            disabled={processingId === assignment.id}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            {processingId === assignment.id ? 'Chiqarilmoqda...' : 'Chiqarish'}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

