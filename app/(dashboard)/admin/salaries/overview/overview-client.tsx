'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight, User, ArrowUpDown } from 'lucide-react'

interface Payment {
  month: number
  type: string
  status: string
  paidAmount: any
  remainingAmount: any
}

interface Employee {
  id: string
  name: string
  email: string
  salary: number
  payments: Payment[]
}

interface Props {
  employees: Employee[]
  currentYear: number
  months: string[]
}

export function SalaryOverviewClient({ employees, currentYear, months }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'debt' | 'paid' | 'partial'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'debt' | 'paid' | 'months'>('name')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Process and filter employees
  const processedEmployees = useMemo(() => {
    return employees.map(emp => {
      const totalPaid = emp.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.paidAmount), 0)
      const totalDebt = emp.payments.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED').reduce((s, p) => s + Number(p.remainingAmount), 0)
      const monthsPaid = emp.payments.filter(p => p.type === 'FULL_SALARY' && p.status === 'PAID').length
      const hasPartial = emp.payments.some(p => p.status === 'PARTIALLY_PAID')
      
      return {
        ...emp,
        totalPaid,
        totalDebt,
        monthsPaid,
        hasPartial,
        status: totalDebt > 0 ? 'debt' : (hasPartial ? 'partial' : (monthsPaid === 12 ? 'paid' : 'incomplete'))
      }
    })
  }, [employees])

  // Filter
  const filteredEmployees = useMemo(() => {
    let result = processedEmployees

    // Search
    if (searchQuery) {
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(emp => emp.status === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'debt') return b.totalDebt - a.totalDebt
      if (sortBy === 'paid') return b.totalPaid - a.totalPaid
      if (sortBy === 'months') return b.monthsPaid - a.monthsPaid
      return 0
    })

    return result
  }, [processedEmployees, searchQuery, filterStatus, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, sortBy])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Qidiruv va Filtr</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ism yoki email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter by Status */}
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🔵 Barchasi ({employees.length})</SelectItem>
                <SelectItem value="debt">
                  🔴 Qarzlari bor ({processedEmployees.filter(e => e.status === 'debt').length})
                </SelectItem>
                <SelectItem value="paid">
                  🟢 To'liq to'langan ({processedEmployees.filter(e => e.status === 'paid').length})
                </SelectItem>
                <SelectItem value="partial">
                  🟡 Qisman to'langan ({processedEmployees.filter(e => e.status === 'partial').length})
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tartiblash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Ism (A-Z)
                  </div>
                </SelectItem>
                <SelectItem value="debt">Qarz (Ko'pdan kamga)</SelectItem>
                <SelectItem value="paid">To'langan (Ko'pdan kamga)</SelectItem>
                <SelectItem value="months">Oylar (Ko'pdan kamga)</SelectItem>
              </SelectContent>
            </Select>

            {/* Results count */}
            <div className="flex items-center justify-center sm:justify-start px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-600">
                {filteredEmployees.length} ta natija
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards */}
      <div className="space-y-4">
        {paginatedEmployees.map((emp) => (
          <Card key={emp.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{emp.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                  </div>
                </div>
                {emp.totalDebt > 0 && (
                  <Badge variant="destructive">
                    Qarz: {(emp.totalDebt / 1000000).toFixed(1)}M so'm
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-muted-foreground mb-1">Oylik</p>
                  <p className="text-xl font-bold text-blue-600">{(emp.salary / 1000000).toFixed(1)}M</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">To'langan</p>
                  <p className="text-xl font-bold text-green-600">{(emp.totalPaid / 1000000).toFixed(1)}M</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-muted-foreground mb-1">Qolgan</p>
                  <p className="text-xl font-bold text-orange-600">{(emp.totalDebt / 1000000).toFixed(1)}M</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-muted-foreground mb-1">Oylar</p>
                  <p className="text-xl font-bold text-purple-600">{emp.monthsPaid}/12</p>
                </div>
              </div>

              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                {months.map((month, i) => {
                  const monthPayment = emp.payments.find(p => p.month === i + 1 && p.type === 'FULL_SALARY')
                  const isPaid = monthPayment?.status === 'PAID'
                  const isPartial = monthPayment?.status === 'PARTIALLY_PAID'
                  const isPending = monthPayment && !isPaid && !isPartial
                  
                  return (
                    <div
                      key={i}
                      className={`flex-1 min-w-[60px] p-2 rounded-lg text-center border-2 ${
                        isPaid ? 'bg-green-500 border-green-600 text-white' :
                        isPartial ? 'bg-yellow-500 border-yellow-600 text-white' :
                        isPending ? 'bg-orange-500 border-orange-600 text-white' :
                        'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                      title={`${month} ${currentYear}`}
                    >
                      <p className="text-xs font-bold">{month}</p>
                      <p className="text-[10px] mt-1">
                        {isPaid ? '✓' : isPartial ? '~' : isPending ? '⏳' : '–'}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="px-2 py-1 bg-green-500 text-white rounded">✓ To'langan</span>
                <span className="px-2 py-1 bg-yellow-500 text-white rounded">~ Qisman</span>
                <span className="px-2 py-1 bg-orange-500 text-white rounded">⏳ Kutilmoqda</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">– Berilmagan</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {paginatedEmployees.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-semibold text-muted-foreground">
                {searchQuery || filterStatus !== 'all' ? 'Natija topilmadi' : 'Xodimlar topilmadi'}
              </p>
              {(searchQuery || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                  className="mt-4"
                >
                  Filtrni tozalash
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="border-2">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} / {filteredEmployees.length}
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Oldingi
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Keyingi
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
