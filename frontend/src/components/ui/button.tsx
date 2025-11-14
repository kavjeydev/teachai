"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { startTransition } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] active:transition-transform active:duration-75",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/95 active:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95 active:shadow-md",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:border-accent active:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/90 active:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, onClick, disabled, children, ...props }, ref) => {
    const [isLocalLoading, setIsLocalLoading] = React.useState(false)

    const isLoading = loading || isLocalLoading

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading || !onClick) return

      try {
        // Call onClick immediately for instant response
        const result = onClick(e)

        // If onClick returns a promise, handle it with loading state
        if (result instanceof Promise) {
          // Set loading state immediately for instant feedback
          setIsLocalLoading(true)

          // Use startTransition to keep UI responsive during async operation
          startTransition(() => {
            result
              .catch((error) => {
                console.error("Button onClick error:", error)
                throw error
              })
              .finally(() => {
                setIsLocalLoading(false)
              })
          })
        }
      } catch (error) {
        console.error("Button onClick error:", error)
        setIsLocalLoading(false)
      }
    }, [onClick, disabled, isLoading])

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isLoading && "cursor-wait"
        )}
        ref={ref}
        onClick={handleClick}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
