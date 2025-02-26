"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "primary" | "secondary"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium",
          {
            "bg-primary text-white hover:bg-primary/90": variant === "primary",
            "border border-input bg-background hover:bg-accent": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-8": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button } 