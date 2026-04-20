'use client'

import { useEffect, useState } from "react"
import "@theme-toggles/react/css/Lightbulb.css"
import { Lightbulb } from "@theme-toggles/react"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg"
}

export default function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use resolvedTheme to get the actual theme (handles 'system' case)
  const isDark = resolvedTheme === 'dark'

  // Size variants
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return <div className={`${sizeClasses[size]} w-[2em] h-[2em]`} />
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${sizeClasses[size]} rounded-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setTheme(isDark ? 'light' : 'dark')
              }
            }}
          >
            <Lightbulb
              duration={650}
              onToggle={() => setTheme(isDark ? 'light' : 'dark')}
              className="text-foreground"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isDark ? "Switch to light mode" : "Switch to dark mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}