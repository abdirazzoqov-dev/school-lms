'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { DollarSign, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface PaymentData {
  name: string
  value: number
  percentage: number
}

const COLORS = [
  '#10b981', // Green - Completed
  '#f59e0b', // Amber - Pending
  '#ef4444', // Red - Failed
  '#6b7280'  // Gray - Refunded
]

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-bold text-sm drop-shadow-lg"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-sm mb-1">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-lg text-gray-900">{formatNumber(data.value)}</span> so'm
        </p>
        <p className="text-xs text-green-600 mt-1">
          {data.percentage.toFixed(1)}% umumiy to'lovdan
        </p>
      </div>
    )
  }
  return null
}

export function PaymentChart({ data }: { data: PaymentData[] }) {
  const totalAmount = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">To'lovlar Holati</CardTitle>
              <CardDescription className="text-xs">Status bo'yicha taqsimot</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xl font-bold">{data.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="stroke-white stroke-2 hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-6 space-y-3">
          {data.map((item, index) => (
            <div 
              key={item.name} 
              className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent hover:from-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  {formatNumber(item.value)} <span className="text-xs text-muted-foreground">so'm</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

