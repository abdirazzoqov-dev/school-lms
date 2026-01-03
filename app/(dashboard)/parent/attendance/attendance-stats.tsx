'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AttendanceStatsProps {
  stats: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
  }
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const attendanceRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Umumiy Statistika</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Davomat foizi</span>
              <span className="text-sm font-bold">{attendanceRate.toFixed(1)}%</span>
            </div>
            <Progress value={attendanceRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Kelgan</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Kelmagan</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Kech kelgan</p>
              <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sababli</p>
              <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

