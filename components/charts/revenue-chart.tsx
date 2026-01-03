'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RevenueData {
  month: string
  amount: number
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value) + ' so\'m'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oylik tushum dinamikasi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar dataKey="amount" fill="#10b981" name="Tushum" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {data.slice(-3).map((item, index) => (
            <div key={item.month} className="p-3 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">{item.month}</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

