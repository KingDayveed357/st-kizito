import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border border-primary/30",
        secondary: "bg-secondary/15 text-secondary border border-secondary/30",
        tertiary: "bg-tertiary/15 text-tertiary border border-tertiary/30",
        destructive: "bg-error/15 text-error border border-error/30",
        success: "bg-success/15 text-success border border-success/30",
        warning: "bg-warning/15 text-warning border border-warning/30",
        outline: "border border-outline text-foreground bg-surface-container-low",
        accent: "bg-accent/15 text-accent border border-accent/30",
        solid: "bg-primary text-on-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
