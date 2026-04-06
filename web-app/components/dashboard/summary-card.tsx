import { Card, CardContent } from "@/components/ui/card-custom"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: "up" | "down"
  }
  className?: string
}

export function SummaryCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-all duration-300", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground/60 uppercase tracking-wider">{title}</p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground mt-2 leading-tight">{value}</p>
            {description && (
              <p className="text-xs text-foreground/60 mt-2">{description}</p>
            )}
          </div>
          {icon && <div className="text-3xl sm:text-4xl flex-shrink-0">{icon}</div>}
        </div>

        {trend && (
          <div className="flex items-center gap-2 text-xs sm:text-sm pt-3 border-t border-outline/10">
            <span
              className={cn(
                "font-semibold",
                trend.direction === "up" ? "text-success" : "text-destructive"
              )}
            >
              {trend.direction === "up" ? "↑" : "↓"}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-foreground/50">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
