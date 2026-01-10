"use client"

import { useEffect, useState } from "react"

interface Star {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

interface Planet {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
}

export function StarField() {
  const [stars, setStars] = useState<Star[]>([])
  const [planets, setPlanets] = useState<Planet[]>([])

  useEffect(() => {
    // Create more stars for a richer background
    const newStars: Star[] = []
    for (let i = 0; i < 80; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 4,
      })
    }
    setStars(newStars)

    // Add floating planets/nebulae for visual interest
    const planetColors = [
      "radial-gradient(circle at 30% 30%, var(--space-purple), transparent)",
      "radial-gradient(circle at 30% 30%, var(--space-cyan), transparent)",
      "radial-gradient(circle at 30% 30%, var(--space-pink), transparent)",
    ]
    const newPlanets: Planet[] = [
      { id: 0, x: 85, y: 15, size: 120, color: planetColors[0], delay: 0 },
      { id: 1, x: 10, y: 70, size: 80, color: planetColors[1], delay: 1 },
      { id: 2, x: 70, y: 80, size: 60, color: planetColors[2], delay: 2 },
    ]
    setPlanets(newPlanets)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, oklch(0.2 0.05 280 / 0.5), transparent 70%)",
        }}
      />

      {/* Floating planets/nebulae */}
      {planets.map((planet) => (
        <div
          key={planet.id}
          className="absolute rounded-full animate-float opacity-30 blur-xl"
          style={{
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            width: `${planet.size}px`,
            height: `${planet.size}px`,
            background: planet.color,
            animationDelay: `${planet.delay}s`,
            animationDuration: "8s",
          }}
        />
      ))}

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-foreground animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Shooting star effect */}
      <div className="absolute top-20 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-shooting-star" />
    </div>
  )
}
