import { Card, CardContent } from "@/components/ui/card-custom"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminPageSkeletonProps {
  rows?: number
}

export function AdminPageSkeleton({ rows = 4 }: AdminPageSkeletonProps) {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
