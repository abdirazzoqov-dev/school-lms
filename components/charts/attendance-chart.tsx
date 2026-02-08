'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts'
import { TrendingUp, Activity } from 'lucide-react'

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
  rate: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function AttendanceChart({ data }: { data: AttendanceData[] }) {
  // Calculate average attendance rate
  const avgRate = data.length > 0 
    ? (data.reduce((sum, d) => sum + d.rate, 0) / data.length).toFixed(1)
    : '0'

  return (
    <Card className="border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Davomat Statistikasi</CardTitle>
              <CardDescription className="text-xs">So'nggi 7 kunlik davomat tahlili</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-2xl font-bold">{avgRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">O'rtacha</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="present"
              fill="url(#colorPresent)"
              stroke="#10b981"
              strokeWidth={0}
            />
            <Line 
              type="monotone" 
              dataKey="present" 
              stroke="#10b981" 
              strokeWidth={3}
              name="✓ Kelgan"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="late" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="⏰ Kech qolgan"
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="absent" 
              stroke="#ef4444" 
              strokeWidth={3}
              name="✗ Kelmagan"
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

