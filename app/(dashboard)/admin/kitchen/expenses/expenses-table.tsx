'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DollarSign,
  Search,
  X
} from 'lucide-react'
import { deleteKitchenExpense } from '@/app/actions/cook'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { useAdminPermissions } from '@/components/admin/permissions-provider'

interface Expense {
  id: string
  amount: any
  date: Date
  paymentMethod: string
  receiptNumber: string | null
  description: string | null
  itemName: string | null
  quantity: any
  unit: string | null
  supplier: string | null
  category: {
    id: string
    name: string
    color: string | null
  }
  createdBy: {
    user: {
      fullName: string
    }
  } | null
}

interface Category {
  id: string
  name: string
  color: string | null
}

interface ExpensesTableProps {
  expenses: Expense[]
  categories: Category[]
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Naqd',
  CLICK: 'Click',
  PAYME: 'Payme',
  UZUM: 'Uzum',
}

export function ExpensesTable({ expenses, categories }: ExpensesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { can } = useAdminPermissions()
  const canUpdate = can('kitchen', 'UPDATE')
  const canDelete = can('kitchen', 'DELETE')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const handleDelete = async () => {
    if (!selectedExpense) return

    setIsLoading(true)
    try {
      const result = await deleteKitchenExpense(selectedExpense.id)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Xarajat o\'chirildi',
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
      setSelectedExpense(null)
    }
  }

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      (expense.itemName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      expense.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || expense.category.id === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Xarajatlar yo'q</h3>
        <p className="text-muted-foreground">
          Yangi xarajat kiritish uchun yuqoridagi tugmani bosing
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color || '#6B7280' }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      <p className="text-sm text-muted-foreground">
        {filteredExpenses.length} ta natija topildi
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sana</TableHead>
            <TableHead>Kategoriya</TableHead>
            <TableHead>Mahsulot</TableHead>
            <TableHead>Miqdori</TableHead>
            <TableHead>Summa</TableHead>
            <TableHead>To'lov turi</TableHead>
            <TableHead>Kirituvchi</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                {new Date(expense.date).toLocaleDateString('uz-UZ')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-6 rounded-full"
                    style={{ backgroundColor: expense.category.color || '#6B7280' }}
                  />
                  <span className="text-sm">{expense.category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {expense.itemName || '-'}
                  </p>
                  {expense.supplier && (
                    <p className="text-xs text-muted-foreground">
                      {expense.supplier}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {expense.quantity ? (
                  <span>{Number(expense.quantity)} {expense.unit || ''}</span>
                ) : '-'}
              </TableCell>
              <TableCell>
                <span className="font-bold text-red-600">
                  -{formatNumber(Number(expense.amount))}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {expense.createdBy?.user?.fullName || 'Admin'}
                </span>
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
                        <Link href={`/admin/kitchen/expenses/${expense.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Tahrirlash
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSelectedExpense(expense)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          O'chirish
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xarajatni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu xarajatni o'chirmoqchimisiz?
              <br />
              <strong>{formatNumber(Number(selectedExpense?.amount || 0))} so'm</strong> - {selectedExpense?.category.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
