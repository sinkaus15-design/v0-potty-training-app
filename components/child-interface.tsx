"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { StarField } from "@/components/star-field"
import { PointsDisplay } from "@/components/points-display"
import { Droplets, CircleDot, Home, Volume2, VolumeX, Rocket, Trophy } from "lucide-react"

interface ChildInterfaceProps {
  childName: string
  totalPoints: number
  userId: string
  hasPendingRequest: boolean
  pendingRequestType?: "pee" | "poop"
}

export function ChildInterface({
  childName,
  totalPoints,
  userId,
  hasPendingRequest: initialPending,
  pendingRequestType: initialType,
}: ChildInterfaceProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasPending, setHasPending] = useState(initialPending)
  const [pendingType, setPendingType] = useState(initialType)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [points, setPoints] = useState(totalPoints)
  const [buttonPressed, setButtonPressed] = useState<"pee" | "poop" | null>(null)

  // Text-to-speech function - only for potty/help requests
  const speak = (text: string) => {
    if (soundEnabled && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      // Use a more natural, warm voice
      utterance.rate = 0.9
      utterance.pitch = 1.15
      utterance.volume = 1.0
      
      // Try to use a more natural voice if available
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") ||
          voice.name.includes("Samantha") ||
          voice.name.includes("Karen") ||
          (voice.lang.startsWith("en") && voice.localService === false)
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  // Load voices when available
  useEffect(() => {
    if ("speechSynthesis" in window) {
      // Chrome loads voices asynchronously
      const loadVoices = () => {
        speechSynthesis.getVoices()
      }
      loadVoices()
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [])

  // Poll for request status changes
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("request-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bathroom_requests",
          filter: `profile_id=eq.${userId}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  // Poll for points updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("points-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "total_points" in payload.new) {
            setPoints(payload.new.total_points as number)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleRequest = async (type: "pee" | "poop") => {
    if (hasPending || isSubmitting) return

    setButtonPressed(type)
    setIsSubmitting(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("bathroom_requests").insert({
        profile_id: userId,
        request_type: type,
        status: "pending",
      })

      if (error) throw error

      setHasPending(true)
      setPendingType(type)

      // TTS only for potty/help requests - this is the explicit signal
      speak(`Great job ${childName}! Help is on the way!`)
    } catch (error) {
      console.error("Failed to create request:", error)
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setButtonPressed(null), 300)
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <StarField />

      {/* Header with clear visual hierarchy */}
      <header className="relative z-10 flex items-center justify-between p-4 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/mode-select")}
          className="h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-sm"
        >
          <Home className="h-7 w-7" />
          <span className="sr-only">Go home</span>
        </Button>

        {/* Animated points display */}
        <button
          onClick={() => {
            // No TTS for navigation
            router.push("/child/rewards")
          }}
          className="transition-transform hover:scale-105 active:scale-95 animate-scale-bounce"
          style={{ animationDuration: "3s" }}
        >
          <PointsDisplay points={points} size="lg" />
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-14 w-14 rounded-2xl bg-muted/50 backdrop-blur-sm"
        >
          {soundEnabled ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}
          <span className="sr-only">{soundEnabled ? "Disable sound" : "Enable sound"}</span>
        </Button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {/* Greeting with animated rocket */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Rocket className="h-10 w-10 text-[var(--space-cyan)] animate-rocket-hover" />
            <h1 className="text-4xl font-bold text-foreground">{hasPending ? "Help Coming!" : `Hi ${childName}!`}</h1>
            <Rocket
              className="h-10 w-10 text-[var(--space-pink)] animate-rocket-hover"
              style={{ animationDelay: "0.5s", transform: "scaleX(-1)" }}
            />
          </div>
          <p className="text-xl text-muted-foreground">
            {hasPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[var(--star-gold)] animate-pulse" />
                Waiting for help...
                <span className="inline-block h-3 w-3 rounded-full bg-[var(--star-gold)] animate-pulse" />
              </span>
            ) : (
              "Tap when you need to go!"
            )}
          </p>
        </div>

        {/* Big, Clear Request Buttons */}
        <div className="flex w-full max-w-md flex-col gap-6">
          {/* Pee Button - Water/Droplet themed */}
          <button
            onClick={() => handleRequest("pee")}
            disabled={hasPending || isSubmitting}
            className={`group relative h-44 w-full rounded-3xl text-3xl font-bold transition-all duration-200 ${
              hasPending && pendingType === "pee"
                ? "bg-[var(--space-cyan)] animate-pulse"
                : hasPending
                  ? "opacity-40 grayscale"
                  : buttonPressed === "pee"
                    ? "scale-95"
                    : "hover:scale-[1.02] active:scale-95"
            }`}
            style={{
              background:
                hasPending && pendingType !== "pee"
                  ? undefined
                  : "linear-gradient(135deg, var(--space-cyan), var(--space-blue))",
              boxShadow: hasPending
                ? "none"
                : "0 12px 40px oklch(0.7 0.15 200 / 0.5), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Big icon with glow effect */}
              <div className="relative">
                <Droplets className="h-20 w-20 text-white animate-glow-pulse" />
                {/* Water droplet effects */}
                <div
                  className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-white/50 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-white/40 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
              <span className="text-white drop-shadow-lg">PEE</span>
            </div>
            {/* Shine overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </button>

          {/* Poop Button - Planet/Circle themed */}
          <button
            onClick={() => handleRequest("poop")}
            disabled={hasPending || isSubmitting}
            className={`group relative h-44 w-full rounded-3xl text-3xl font-bold transition-all duration-200 ${
              hasPending && pendingType === "poop"
                ? "bg-[var(--space-purple)] animate-pulse"
                : hasPending
                  ? "opacity-40 grayscale"
                  : buttonPressed === "poop"
                    ? "scale-95"
                    : "hover:scale-[1.02] active:scale-95"
            }`}
            style={{
              background:
                hasPending && pendingType !== "poop"
                  ? undefined
                  : "linear-gradient(135deg, var(--space-purple), var(--space-pink))",
              boxShadow: hasPending
                ? "none"
                : "0 12px 40px oklch(0.65 0.25 280 / 0.5), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <CircleDot className="h-20 w-20 text-white animate-glow-pulse" />
                {/* Planet ring effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-28 border-2 border-white/30 rounded-full transform rotate-12" />
                </div>
              </div>
              <span className="text-white drop-shadow-lg">POOP</span>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </button>
        </div>

        {/* Rewards Button - Always visible, encouraging */}
        <button
          onClick={() => {
            // No TTS for navigation
            router.push("/child/rewards")
          }}
          className="flex items-center gap-3 mt-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--star-gold)] to-[oklch(0.75_0.18_60)] text-[oklch(0.15_0.02_60)] font-bold text-xl transition-transform hover:scale-105 active:scale-95"
          style={{
            boxShadow: "0 8px 24px oklch(0.85 0.15 90 / 0.4)",
          }}
        >
          <Trophy className="h-8 w-8" />
          <span>My Rewards!</span>
        </button>
      </div>
    </main>
  )
}
