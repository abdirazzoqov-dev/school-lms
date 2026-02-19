'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useToast } from '@/components/ui/use-toast'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserX, 
  UserCheck,
  Mail,
  Phone,
  ChefHat
} from 'lucide-react'
import { deactivateCook, activateCook, deleteCook } from '@/app/actions/cook'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { useAdminPermissions } from '@/components/admin/permissions-provider'

interface Cook {
  id: string
  cookCode: string
  specialization: string
  experienceYears: number | null
  position: string
  salary: any
  hireDate: Date
  user: {
    fullName: string
    email: string
    phone: string | null
    isActive: boolean
    lastLogin: Date | null
  }
  _count: {
    kitchenExpenses: number
  }
}

interface CooksTableProps {
  cooks: Cook[]
}

const positionLabels: Record<string, { label: string; color: string }> = {
  HEAD_COOK: { label: 'Bosh Oshpaz', color: 'bg-orange-100 text-orange-800' },
  COOK: { label: 'Oshpaz', color: 'bg-blue-100 text-blue-800' },
  ASSISTANT: { label: 'Yordamchi', color: 'bg-gray-100 text-gray-800' },
}

export function CooksTable({ cooks }: CooksTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCook, setSelectedCook] = useState<Cook | null>(null)
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | 'delete' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { can } = useAdminPermissions()
  const canUpdate = can('kitchen', 'UPDATE')
  const canDelete = can('kitchen', 'DELETE')

  const handleAction = async () => {
    if (!selectedCook || !actionType) return

    setIsLoading(true)
    try {
      let result
      switch (actionType) {
        case 'deactivate':
          result = await deactivateCook(selectedCook.id)
          break
        case 'activate':
          result = await activateCook(selectedCook.id)
          break
        case 'delete':
          result = await deleteCook(selectedCook.id)
          break
      }

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: actionType === 'delete' 
            ? 'Oshpaz o\'chirildi' 
            : actionType === 'deactivate'
            ? 'Oshpaz deaktiv qilindi'
            : 'Oshpaz faollashtirildi',
        })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          title: 'Xato!',
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Nimadir xato ketdi',
      })
    } finally {
      setIsLoading(false)
      setSelectedCook(null)
      setActionType(null)
    }
  }

  if (cooks.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Oshpazlar yo'q</h3>
        <p className="text-muted-foreground">
          Yangi oshpaz qo'shish uchun yuqoridagi tugmani bosing
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Oshpaz</TableHead>
            <TableHead>Kod</TableHead>
            <TableHead>Lavozim</TableHead>
            <TableHead>Mutaxassislik</TableHead>
            <TableHead>Tajriba</TableHead>
            <TableHead>Xarajatlar</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cooks.map((cook) => (
            <TableRow key={cook.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{cook.user.fullName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {cook.user.email}
                  </div>
                  {cook.user.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {cook.user.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <code className="px-2 py-1 rounded bg-muted text-sm">
                  {cook.cookCode}
                </code>
              </TableCell>
              <TableCell>
                <Badge className={positionLabels[cook.position]?.color || 'bg-gray-100'}>
                  {positionLabels[cook.position]?.label || cook.position}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {cook.specialization}
              </TableCell>
              <TableCell>
                {cook.experienceYears ? `${cook.experienceYears} yil` : '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {cook._count.kitchenExpenses} ta
                </Badge>
              </TableCell>
              <TableCell>
                {cook.user.isActive ? (
                  <Badge className="bg-green-100 text-green-800">Faol</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Nofaol</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canUpdate && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/kitchen/cooks/${cook.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Tahrirlash
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canUpdate && (
                      <>
                        <DropdownMenuSeparator />
                        {cook.user.isActive ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCook(cook)
                              setActionType('deactivate')
                            }}
                            className="text-orange-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deaktiv qilish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCook(cook)
                              setActionType('activate')
                            }}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Faollashtirish
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCook(cook)
                          setActionType('delete')
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        O'chirish
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedCook && !!actionType} onOpenChange={() => {
        setSelectedCook(null)
        setActionType(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' && 'Oshpazni o\'chirish'}
              {actionType === 'deactivate' && 'Oshpazni deaktiv qilish'}
              {actionType === 'activate' && 'Oshpazni faollashtirish'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' && (
                <>Haqiqatan ham <strong>{selectedCook?.user.fullName}</strong> ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.</>
              )}
              {actionType === 'deactivate' && (
                <>Haqiqatan ham <strong>{selectedCook?.user.fullName}</strong> ni deaktiv qilmoqchimisiz? U tizimga kira olmaydi.</>
              )}
              {actionType === 'activate' && (
                <>Haqiqatan ham <strong>{selectedCook?.user.fullName}</strong> ni faollashtirasizmi?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isLoading}
              className={
                actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                actionType === 'deactivate' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-green-600 hover:bg-green-700'
              }
            >
              {isLoading ? 'Yuklanmoqda...' : 'Tasdiqlash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

