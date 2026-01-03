'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface PaymentHistoryItem {
  date: string
  amount: number
  method: string
  note?: string
}

interface SalaryPaymentHistoryProps {
  notes: string | null
  paidAmount: number
  totalAmount: number
  status: string
}

export function SalaryPaymentHistory({ notes, paidAmount, totalAmount, status }: SalaryPaymentHistoryProps) {
  // Parse payment history from notes
  const parsePaymentHistory = (notes: string | null): PaymentHistoryItem[] => {
    if (!notes) return []
    
    const history: PaymentHistoryItem[] = []
    const lines = notes.split('\n')
    
    for (const line of lines) {
      // Parse format: [12/14/2025] +1,000,000 so'm (Naqd): Avans
      const match = line.match(/\[(.+?)\]\s*\+?([\d,]+)\s*so'm\s*\((.+?)\)(?::\s*(.+))?/)
      if (match) {
        history.push({
          date: match[1],
          amount: parseInt(match[2].replace(/,/g, '')),
          method: match[3],
          note: match[4]
        })
      }
    }
    
    return history
  }

  const history = parsePaymentHistory(notes)
  const percentage = Math.round((paidAmount / totalAmount) * 100)

  if (history.length === 0) {
    return null
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          To'lov Tarixi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((item, index) => {
          const isLast = index === history.length - 1
          
          return (
            <div key={index} className="flex items-start gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${isLast ? 'bg-green-500' : 'bg-blue-500'}`} />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-blue-300 mt-1 mb-1" style={{ minHeight: '20px' }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-green-600">
                    +{formatNumber(item.amount)} so'm
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.method}
                  </Badge>
                  {item.note && (
                    <span className="text-xs text-muted-foreground italic">
                      {item.note}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.date}
                </p>
              </div>
            </div>
          )
        })}

        {/* Summary */}
        <div className="pt-3 border-t border-blue-200 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === 'PAID' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-orange-600" />
              )}
              <span className="text-sm font-medium">
                {history.length} ta to'lov
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Jami to'langan:</p>
              <p className="text-lg font-bold text-green-600">
                {formatNumber(paidAmount)} so'm
              </p>
              <p className="text-xs text-blue-600">
                {percentage}% / {formatNumber(totalAmount)} so'm
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

