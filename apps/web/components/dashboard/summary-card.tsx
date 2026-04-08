import { Card, CardContent } from "@/components/ui/card-custom"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  deltaLabel?: string
  className?: string
}

export function SummaryCard({
  title,
  value,
  description,
  icon,
  deltaLabel,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("border-outline/20 shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">{title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            {description ? <p className="mt-2 text-sm text-foreground/60">{description}</p> : null}
          </div>
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-foreground/75">
              {icon}
            </div>
          ) : null}
        </div>

        {deltaLabel ? (
          <div className="mt-4 border-t border-outline/10 pt-3 text-xs text-foreground/55">{deltaLabel}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SummaryCardSkeleton() {
  return (
    <Card className="border-outline/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-9 w-24" />
            <Skeleton className="mt-3 h-3 w-36" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-3 w-40" />
      </CardContent>
    </Card>
  )
}
