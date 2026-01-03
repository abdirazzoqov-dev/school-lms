'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
  rate: number
}

export function AttendanceChart({ data }: { data: AttendanceData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Davomat statistikasi (7 kun)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="present" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Kelgan"
            />
            <Line 
              type="monotone" 
              dataKey="absent" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Kelmagan"
            />
            <Line 
              type="monotone" 
              dataKey="late" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Kech"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

