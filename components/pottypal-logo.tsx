"use client"

import { cn } from "@/lib/utils"

interface PottyPalLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function PottyPalLogo({ size = "md", showText = true, className }: PottyPalLogoProps) {
  const sizeClasses = {
    sm: "h-16 w-16 text-4xl",
    md: "h-24 w-24 text-5xl",
    lg: "h-32 w-32 text-6xl",
    xl: "h-40 w-40 text-7xl",
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className={cn("relative animate-float", sizeClasses[size])}>
        {/* Main toilet icon with face - using emoji for better compatibility */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 animate-pulse-glow shadow-2xl flex items-center justify-center">
            <span className="relative z-10">🚽</span>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-blue-400/20 blur-xl animate-pulse"></div>
          </div>
        </div>
        {/* Star decoration */}
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "2s" }}>
          ⭐
        </div>
      </div>
      {showText && (
        <h1 className={cn("font-bold tracking-tight bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent", textSizes[size])}>
          PottyPal
        </h1>
      )}
    </div>
  )
}
