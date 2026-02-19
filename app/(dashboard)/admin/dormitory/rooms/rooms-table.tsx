'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { deleteRoom } from '@/app/actions/dormitory'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Filter, 
  X, 
  BedDouble,
  Users,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  DoorClosed
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Room {
  id: string
  roomNumber: string
  floor: number
  capacity: number
  occupiedBeds: number
  roomType: 'STANDARD' | 'LUXURY' | 'SUITE'
  pricePerMonth: number
  gender: 'MALE' | 'FEMALE' | null
  building: {
    name: string
    code: string
  }
  beds: {
    id: string
    bedNumber: string
    isOccupied: boolean
    bedType: string
  }[]
}

interface Building {
  id: string
  name: string
  code: string
}

interface SearchParams {
  building?: string
  status?: string
  availability?: string
}

interface RoomsTableProps {
  rooms: Room[]
  buildings: Building[]
  searchParams: SearchParams
}

export function RoomsTable({ rooms, buildings, searchParams }: RoomsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()
  const { toast } = useToast()
  const [showFilters, setShowFilters] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('Xonani o\'chirmoqchimisiz? Bu amalni bekor qilib bo\'lmaydi.')) return

    setDeletingId(roomId)

    const result = await deleteRoom(roomId)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Xona o\'chirildi',
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

  const hasActiveFilters = searchParams.building || searchParams.availability

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0.5 text-xs">
              {[searchParams.building, searchParams.availability]
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bino</label>
            <Select
              value={searchParams.building || 'all'}
              onValueChange={(value) => updateSearchParams('building', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Barcha binolar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha binolar</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mavjudlik</label>
            <Select
              value={searchParams.availability || 'all'}
              onValueChange={(value) => updateSearchParams('availability', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="available">Bo'sh joy bor</SelectItem>
                <SelectItem value="full">To'liq band</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Jami <span className="font-semibold text-foreground">{rooms.length}</span> ta xona topildi
        </p>
      </div>

      {/* Table */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <DoorClosed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Xonalar topilmadi</h3>
          <p className="text-muted-foreground mb-4">
            Hozircha xonalar ro'yxati bo'sh
          </p>
          <Link href="/admin/dormitory/rooms/create">
            <Button>
              <DoorClosed className="h-4 w-4 mr-2" />
              Birinchi xonani qo'shish
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Xona</TableHead>
                <TableHead>Bino</TableHead>
                <TableHead>Qavat</TableHead>
                <TableHead>Joylar</TableHead>
                <TableHead>Bo'sh Joylar</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Narx</TableHead>
                <TableHead className="w-[70px]">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room, index) => {
                const availableBeds = room.capacity - room.occupiedBeds
                const occupancyRate = (room.occupiedBeds / room.capacity) * 100

                return (
                  <TableRow key={room.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-semibold font-mono">{room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.roomType}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{room.building.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.building.code}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="font-mono">{room.floor}-qavat</p>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{room.capacity}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            availableBeds > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {availableBeds}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {room.capacity}
                          </span>
                        </div>
                        {/* Visual bed indicators */}
                        <div className="flex gap-1 flex-wrap">
                          {room.beds.map((bed) => (
                            <div
                              key={bed.id}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs ${
                                bed.isOccupied
                                  ? 'bg-red-100 border-red-300 text-red-700'
                                  : 'bg-green-100 border-green-300 text-green-700'
                              }`}
                              title={`Joy #${bed.bedNumber} - ${bed.isOccupied ? 'Band' : 'Bo\'sh'}`}
                            >
                              {bed.bedNumber}
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              occupancyRate >= 100
                                ? 'bg-red-500'
                                : occupancyRate > 0
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {occupancyRate.toFixed(0)}% band
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {Number(room.pricePerMonth) === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🎓 Bepul
                        </span>
                      ) : (
                        <>
                          <p className="font-semibold text-sm">
                            {Number(room.pricePerMonth).toLocaleString()} so'm
                          </p>
                          <p className="text-xs text-muted-foreground">oyiga</p>
                        </>
                      )}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/dormitory/rooms/${room.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ko'rish
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/dormitory/rooms/${room.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Tahrirlash
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(room.id)}
                            disabled={deletingId === room.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingId === room.id ? 'O\'chirilmoqda...' : 'O\'chirish'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

