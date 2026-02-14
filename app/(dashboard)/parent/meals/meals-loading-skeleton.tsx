import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function MealsLoadingSkeleton() {
  const DAYS = 7
  const MEALS_PER_DAY = 5

  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Tabs Skeleton */}
      <div>
        <div className="w-full h-auto p-1 bg-muted/30 border rounded-lg inline-flex gap-1 overflow-x-auto mb-6">
          {Array.from({ length: DAYS }).map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 h-12 w-28 rounded-md" />
          ))}
        </div>

        {/* Meals Grid Skeleton */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: MEALS_PER_DAY }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-36 w-full" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

