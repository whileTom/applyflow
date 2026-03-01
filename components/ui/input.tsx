import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        type === "file" && [
          "h-10", // Increased from h-7 to h-10
          "border-0",
          "shadow-none",
          "text-transparent",
          "file:absolute file:right-0 file:top-1/2 file:-translate-y-1/2",
          "file:h-8 file:px-3 file:rounded-md file:border-0",
          "file:bg-primary file:text-primary-foreground file:text-sm file:font-medium",
          "file:cursor-pointer file:transition-colors",
          "hover:file:bg-primary/80",
          "relative",
        ],
        className,
      )}
      {...props}
    />
  )
}

export { Input }
