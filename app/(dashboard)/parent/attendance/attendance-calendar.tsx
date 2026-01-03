'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, BookOpen } from 'lucide-react'

interface Attendance {
  id: string
  date: Date
  status: string
  notes: string | null
  subject: {
    name: string
    code: string
  }
  teacher: {
    user: {
      fullName: string
    } | null
  }
}

interface AttendanceCalendarProps {
  attendances: Attendance[]
  period: string
}

export function AttendanceCalendar({ attendances, period }: AttendanceCalendarProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-500">Kelgan</Badge>
      case 'ABSENT':
        return <Badge className="bg-red-500">Kelmagan</Badge>
      case 'LATE':
        return <Badge className="bg-orange-500">Kech keldi</Badge>
      case 'EXCUSED':
        return <Badge className="bg-blue-500">Sababli</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Group by date
  const groupedByDate = attendances.reduce((acc, att) => {
    const dateKey = new Date(att.date).toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(att)
    return acc
  }, {} as Record<string, Attendance[]>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Oxirgi Davomat Yozuvlari
        </CardTitle>
        <CardDescription>
          Kunlik davomat ma'lumotlari
        </CardDescription>
      </CardHeader>
      <CardContent>
        {attendances.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Tanlangan davrda davomat yozuvlari yo'q
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.slice(0, 10).map((dateKey) => {
              const records = groupedByDate[dateKey]
              const date = new Date(dateKey)

              return (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-600">
                      {date.toLocaleDateString('uz-UZ', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                  </div>

                  <div className="grid gap-3">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{record.subject.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.teacher.user?.fullName || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {record.notes && (
                            <p className="text-sm text-muted-foreground max-w-xs truncate">
                              {record.notes}
                            </p>
                          )}
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {sortedDates.length > 10 && (
              <p className="text-center text-sm text-muted-foreground pt-4">
                Va yana {sortedDates.length - 10} kun...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

