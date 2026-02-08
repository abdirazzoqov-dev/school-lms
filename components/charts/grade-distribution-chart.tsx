'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Award, TrendingUp } from 'lucide-react'

interface GradeDistribution {
  range: string
  count: number
  percentage: number
}

const COLORS = [
  '#ef4444', // Red - F (0-39%)
  '#f59e0b', // Amber - D-C (40-69%)
  '#10b981', // Green - B (70-89%)
  '#3b82f6'  // Blue - A (90-100%)
]

const GRADE_ICONS = ['❌', '⚠️', '✓', '⭐']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-sm mb-2">{label}</p>
        <p className="text-xs text-muted-foreground">
          O'quvchilar: <span className="font-bold text-lg text-gray-900">{data.count}</span>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {data.percentage.toFixed(1)}% umumiy o'quvchilardan
        </p>
      </div>
    )
  }
  return null
}

export function GradeDistributionChart({ data }: { data: GradeDistribution[] }) {
  const totalStudents = data.reduce((sum, item) => sum + item.count, 0)
  const topPerformers = data.find(d => d.range.includes('90-100'))

  return (
    <Card className="border-t-4 border-t-purple-500 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Baholar Taqsimoti</CardTitle>
              <CardDescription className="text-xs">O'quvchilar natijalari tahlili</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-purple-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-2xl font-bold">{totalStudents}</span>
            </div>
            <p className="text-xs text-muted-foreground">Jami baholangan</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              {COLORS.map((color, index) => (
                <linearGradient key={`gradient-${index}`} id={`colorGrade${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.6}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={() => 'O\'quvchilar soni'}
            />
            <Bar 
              dataKey="count" 
              name="O'quvchilar soni"
              radius={[8, 8, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#colorGrade${index})`}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.map((item, index) => (
            <div 
              key={item.range} 
              className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-2xl">{GRADE_ICONS[index]}</span>
              </div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                {item.range}
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-gray-900">
                  {item.count}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({item.percentage.toFixed(0)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Performance Insight */}
        {topPerformers && topPerformers.count > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  🎉 A'lo natija: {topPerformers.count} ta o'quvchi
                </p>
                <p className="text-xs text-muted-foreground">
                  {topPerformers.percentage.toFixed(1)}% o'quvchilar 90% dan yuqori ball olishdi
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

