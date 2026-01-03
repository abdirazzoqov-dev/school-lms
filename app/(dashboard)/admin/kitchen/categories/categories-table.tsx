'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Utensils
} from 'lucide-react'
import { deleteKitchenExpenseCategory } from '@/app/actions/cook'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description: string | null
  limitAmount: any
  period: string
  color: string | null
  icon: string | null
  isActive: boolean
  _count: {
    kitchenExpenses: number
  }
  thisMonthExpense: any
}

interface CategoriesTableProps {
  categories: Category[]
}

const periodLabels: Record<string, string> = {
  DAILY: 'Kunlik',
  WEEKLY: 'Haftalik',
  MONTHLY: 'Oylik',
  YEARLY: 'Yillik',
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!selectedCategory) return

    setIsLoading(true)
    try {
      const result = await deleteKitchenExpenseCategory(selectedCategory.id)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Kategoriya o\'chirildi',
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
      setSelectedCategory(null)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Kategoriyalar yo'q</h3>
        <p className="text-muted-foreground">
          Yangi kategoriya qo'shish uchun yuqoridagi tugmani bosing
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kategoriya</TableHead>
            <TableHead>Limit</TableHead>
            <TableHead>Bu oy sarflandi</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Xarajatlar</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => {
            const percentage = category.limitAmount > 0 
              ? (Number(category.thisMonthExpense) / Number(category.limitAmount)) * 100 
              : 0
            const isOverLimit = percentage > 100

            return (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-8 rounded-full"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{formatNumber(category.limitAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {periodLabels[category.period] || category.period}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={isOverLimit ? 'text-red-600 font-bold' : ''}>
                    {formatNumber(category.thisMonthExpense)}
                  </span>
                </TableCell>
                <TableCell className="w-[150px]">
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${isOverLimit ? '[&>div]:bg-red-500' : ''}`}
                    />
                    <p className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {category._count.kitchenExpenses} ta
                  </Badge>
                </TableCell>
                <TableCell>
                  {category.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Faol</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Nofaol</Badge>
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
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/kitchen/categories/${category.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Tahrirlash
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSelectedCategory(category)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham <strong>{selectedCategory?.name}</strong> kategoriyasini o'chirmoqchimisiz?
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
    </>
  )
}

