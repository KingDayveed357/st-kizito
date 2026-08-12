import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean
  helperText?: string
  label?: string
  icon?: React.ReactNode
}

/**
 * The admin's labelled text input.
 *
 * Previously the <label> carried no `htmlFor` and the <input> no `id`, so the two were never
 * associated — a screen reader announced an unlabelled field, and clicking the label did nothing.
 * `useId` now wires them together, and `helperText` is linked with `aria-describedby` so validation
 * messages are announced rather than only seen.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", isInvalid = false, helperText, label, icon, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const helperId = helperText ? `${inputId}-helper` : undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            aria-invalid={isInvalid || undefined}
            aria-describedby={helperId}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              isInvalid && "border-destructive focus-visible:ring-destructive",
              icon && "pl-9",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {helperText && (
          <p
            id={helperId}
            className={cn("text-xs mt-1", isInvalid ? "text-destructive" : "text-muted-foreground")}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
