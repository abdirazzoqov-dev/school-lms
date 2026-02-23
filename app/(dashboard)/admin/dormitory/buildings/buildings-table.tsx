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
import { Building2, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { deleteBuilding } from '@/app/actions/dormitory'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { useAdminPermissions } from '@/components/admin/permissions-provider'

interface Building {
  id: string
  name: string
  code: string
  gender: 'MALE' | 'FEMALE' | null
  totalFloors: number
  totalRooms: number
  totalCapacity: number
  occupiedBeds: number
  isActive: boolean
  rooms: {
    id: string
    capacity: number
    occupiedBeds: number
    isActive: boolean
  }[]
}

interface BuildingsTableProps {
  buildings: Building[]
}

export function BuildingsTable({ buildings }: BuildingsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { can } = useAdminPermissions()
  const canRead = can('dormitory', 'READ')
  const canCreate = can('dormitory', 'CREATE')
  const canUpdate = can('dormitory', 'UPDATE')
  const canDelete = can('dormitory', 'DELETE')

  const handleDelete = async (buildingId: string) => {
    if (!confirm('Binoni o\'chirmoqchimisiz?')) return

    setDeletingId(buildingId)

    const result = await deleteBuilding(buildingId)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Bino o\'chirildi',
      })
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: result.error,
      })
    }

    setDeletingId(null)
  }

  if (buildings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Binolar topilmadi</h3>
        <p className="text-muted-foreground mb-4">
          Hozircha yotoqxona binolari mavjud emas
        </p>
        {canCreate && (
          <Link href="/admin/dormitory/buildings/create">
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              Birinchi binoni qo'shish
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
            <TableHead>Bino</TableHead>
            <TableHead>Jins</TableHead>
            <TableHead>Qavatlar</TableHead>
            <TableHead>Xonalar</TableHead>
            <TableHead>Joylar</TableHead>
            <TableHead>Band</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buildings.map((building, index) => {
            const availableBeds = building.totalCapacity - building.occupiedBeds
            const occupancyRate = building.totalCapacity > 0
              ? (building.occupiedBeds / building.totalCapacity) * 100
              : 0

            return (
              <TableRow key={building.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-medium">{building.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Kod: {building.code}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  {building.gender ? (
                    <Badge
                      variant="outline"
                      className={
                        building.gender === 'MALE'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-pink-50 text-pink-700'
                      }
                    >
                      {building.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Aralash</Badge>
                  )}
                </TableCell>

                <TableCell>
                  <p className="font-mono font-semibold">{building.totalFloors}</p>
                </TableCell>

                <TableCell>
                  <p className="font-mono font-semibold">{building.totalRooms}</p>
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-semibold">{building.totalCapacity}</p>
                    <p className="text-xs text-green-600">{availableBeds} bo'sh</p>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-semibold">{building.occupiedBeds}</p>
                    <p className="text-xs text-muted-foreground">
                      {occupancyRate.toFixed(1)}%
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={building.isActive ? 'default' : 'secondary'}
                    className={
                      building.isActive
                        ? 'bg-green-500 hover:bg-green-600'
                        : ''
                    }
                  >
                    {building.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </TableCell>

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
                          <Link href={`/admin/dormitory/buildings/${building.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ko'rish
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/dormitory/buildings/${building.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Tahrirlash
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(building.id)}
                            disabled={deletingId === building.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingId === building.id ? 'O\'chirilmoqda...' : 'O\'chirish'}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

