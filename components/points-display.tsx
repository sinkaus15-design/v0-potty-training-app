"use client"

import { Star, Sparkles } from "lucide-react"

interface PointsDisplayProps {
  points: number
  size?: "sm" | "md" | "lg"
}

export function PointsDisplay({ points, size = "md" }: PointsDisplayProps) {
  const sizeClasses = {
    sm: "h-10 px-4 text-base gap-2",
    md: "h-14 px-5 text-xl gap-2",
    lg: "h-16 px-6 text-2xl gap-3",
  }

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  }

  return (
    <div
      className={`relative flex items-center rounded-full bg-gradient-to-r from-[var(--star-gold)] to-[oklch(0.75_0.18_60)] font-bold text-[oklch(0.15_0.02_60)] ${sizeClasses[size]}`}
      style={{
        boxShadow: "0 6px 20px oklch(0.85 0.15 90 / 0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
      }}
    >
      {/* Sparkle effects */}
      <Sparkles className={`${iconSizes[size]} animate-pulse`} style={{ animationDuration: "1.5s" }} />
      <Star className={`${iconSizes[size]} fill-current`} />
      <span className="font-extrabold tracking-wide">{points.toLocaleString()}</span>

      {/* Shine animation overlay */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 animate-progress-shine" />
      </div>
    </div>
  )
}
