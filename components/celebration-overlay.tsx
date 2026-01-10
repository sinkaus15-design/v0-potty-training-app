"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star, Sparkles, Rocket } from "lucide-react"

interface CelebrationOverlayProps {
  pointsEarned: number
  childName: string
  requestType?: "pee" | "poop"
}

export function CelebrationOverlay({ pointsEarned, childName, requestType = "pee" }: CelebrationOverlayProps) {
  const router = useRouter()
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; delay: number; color: string; size: number }>
  >([])
  const [celebrationMessage, setCelebrationMessage] = useState(`Amazing job ${childName}!`)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Generate more colorful confetti
    const colors = [
      "var(--space-purple)",
      "var(--space-cyan)",
      "var(--star-gold)",
      "var(--space-pink)",
      "var(--space-blue)",
      "#fff",
    ]
    const newConfetti = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 12 + 6,
    }))
    setConfetti(newConfetti)

    // Animate content in
    setTimeout(() => setShowContent(true), 200)

    const fetchCelebrationMessage = async () => {
      try {
        const response = await fetch("/api/celebration-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childName, requestType, pointsEarned }),
        })
        const data = await response.json()
        if (data.message) {
          setCelebrationMessage(data.message)
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(data.message + ` You earned ${pointsEarned} points!`)
            utterance.rate = 0.85
            utterance.pitch = 1.2
            speechSynthesis.speak(utterance)
          }
        }
      } catch {
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(`Amazing job ${childName}! You earned ${pointsEarned} points!`)
          utterance.rate = 0.85
          utterance.pitch = 1.2
          speechSynthesis.speak(utterance)
        }
      }
    }

    fetchCelebrationMessage()
  }, [childName, pointsEarned, requestType])

  const dismiss = () => {
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden">
      {/* Radial glow background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 40%, oklch(0.65 0.25 280 / 0.3), transparent 60%)",
        }}
      />

      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${piece.x}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animation: `confetti-fall 3s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}

      {/* Floating rockets */}
      <Rocket className="absolute top-20 left-10 h-12 w-12 text-[var(--space-cyan)] animate-rocket-hover opacity-60" />
      <Rocket
        className="absolute top-32 right-16 h-10 w-10 text-[var(--space-pink)] animate-rocket-hover opacity-60"
        style={{ animationDelay: "0.5s", transform: "scaleX(-1)" }}
      />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center gap-6 p-8 text-center transition-all duration-500 ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        {/* Big animated star */}
        <div className="relative animate-bounce">
          <div
            className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[var(--star-gold)] to-[oklch(0.75_0.18_60)]"
            style={{
              boxShadow: "0 0 60px oklch(0.85 0.15 90 / 0.6)",
            }}
          >
            <Star className="h-20 w-20 fill-[oklch(0.15_0.02_60)] text-[oklch(0.15_0.02_60)]" />
          </div>
          <Sparkles className="absolute -right-4 -top-4 h-12 w-12 text-[var(--star-gold)] animate-pulse" />
          <Sparkles
            className="absolute -bottom-2 -left-4 h-8 w-8 text-[var(--space-cyan)] animate-pulse"
            style={{ animationDelay: "0.3s" }}
          />
          <Sparkles
            className="absolute top-4 -right-6 h-6 w-6 text-[var(--space-pink)] animate-pulse"
            style={{ animationDelay: "0.6s" }}
          />
        </div>

        {/* Big celebration text */}
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold text-[var(--star-gold)] tracking-wide">AMAZING!</h1>
          <p className="text-2xl text-foreground font-medium max-w-xs leading-relaxed">{celebrationMessage}</p>
        </div>

        {/* Points earned - big and clear */}
        <div
          className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-[var(--star-gold)] to-[oklch(0.75_0.18_60)] px-10 py-5"
          style={{
            boxShadow: "0 8px 32px oklch(0.85 0.15 90 / 0.5)",
          }}
        >
          <Star className="h-12 w-12 fill-[oklch(0.15_0.02_60)] text-[oklch(0.15_0.02_60)]" />
          <span className="text-5xl font-extrabold text-[oklch(0.15_0.02_60)]">+{pointsEarned}</span>
        </div>

        <Button
          onClick={dismiss}
          className="h-16 w-full max-w-xs text-xl font-bold bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)] mt-4"
          style={{
            boxShadow: "0 8px 24px oklch(0.65 0.25 280 / 0.4)",
          }}
        >
          AWESOME!
        </Button>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
