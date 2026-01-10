"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { StarField } from "@/components/star-field"
import { PointsDisplay } from "@/components/points-display"
import type { Reward } from "@/lib/types"
import { ArrowLeft, Gift, Star, Volume2, VolumeX, Lock, Sparkles, Trophy } from "lucide-react"

interface RewardsStoreProps {
  childName: string
  totalPoints: number
  rewards: Reward[]
  userId: string
}

export function RewardsStore({ childName, totalPoints, rewards, userId }: RewardsStoreProps) {
  const router = useRouter()
  const [points, setPoints] = useState(totalPoints)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [redeemedReward, setRedeemedReward] = useState<Reward | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const speak = (text: string) => {
    if (soundEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.pitch = 1.1
      speechSynthesis.speak(utterance)
    }
  }

  // Greet on mount
  useEffect(() => {
    speak(`${childName}, here are your rewards! You have ${totalPoints} points.`)
  }, [])

  // Real-time points updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("points-updates-store")
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

  const handleRedeem = async (reward: Reward) => {
    if (points < reward.points_cost || isRedeeming) return

    setIsRedeeming(true)
    const supabase = createClient()

    try {
      await supabase.from("redeemed_rewards").insert({
        profile_id: userId,
        reward_id: reward.id,
        points_spent: reward.points_cost,
      })

      await supabase
        .from("profiles")
        .update({ total_points: points - reward.points_cost })
        .eq("id", userId)

      setPoints(points - reward.points_cost)
      setRedeemedReward(reward)
      setShowCelebration(true)
      speak(`Awesome ${childName}! You got ${reward.name}!`)
    } catch (error) {
      console.error("Failed to redeem reward:", error)
    } finally {
      setIsRedeeming(false)
    }
  }

  // Sort rewards by points (tier system)
  const sortedRewards = [...rewards].sort((a, b) => a.points_cost - b.points_cost)

  // Celebration screen
  if (showCelebration && redeemedReward) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <StarField />
        <div className="relative z-10 flex flex-col items-center gap-8 p-8 text-center">
          <div className="animate-bounce">
            {redeemedReward.image_url ? (
              <div className="h-40 w-40 rounded-3xl overflow-hidden border-4 border-[var(--star-gold)] shadow-2xl">
                <img
                  src={redeemedReward.image_url || "/placeholder.svg"}
                  alt={redeemedReward.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--star-gold)] to-[oklch(0.75_0.18_60)]">
                <Trophy className="h-20 w-20 text-[oklch(0.15_0.02_60)]" />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-[var(--star-gold)]">YOU GOT IT!</h1>
            <p className="text-3xl font-bold text-foreground">{redeemedReward.name}</p>
            {redeemedReward.description && (
              <p className="text-xl text-muted-foreground">{redeemedReward.description}</p>
            )}
          </div>
          <Button
            onClick={() => {
              setShowCelebration(false)
              setRedeemedReward(null)
            }}
            className="h-16 w-full max-w-xs text-xl font-bold bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
          >
            AWESOME!
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-svh pb-8">
      <StarField />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/child")}
            className="h-14 w-14 rounded-2xl bg-muted/50"
          >
            <ArrowLeft className="h-7 w-7" />
            <span className="sr-only">Go back</span>
          </Button>

          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-[var(--star-gold)]" />
            My Rewards
          </h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-14 w-14 rounded-2xl bg-muted/50"
          >
            {soundEnabled ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}
          </Button>
        </div>
      </header>

      {/* Points Banner - Big and Clear */}
      <div className="relative z-10 flex justify-center p-6">
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-card/80 px-8 py-5 backdrop-blur-sm border border-border/50">
          <span className="text-lg text-muted-foreground font-medium">Your Points</span>
          <PointsDisplay points={points} size="lg" />
        </div>
      </div>

      {/* Rewards List */}
      <div className="relative z-10 px-4 space-y-4">
        {sortedRewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Gift className="h-24 w-24 text-muted-foreground/30 mb-4" />
            <p className="text-2xl font-bold text-muted-foreground">No Rewards Yet</p>
            <p className="text-lg text-muted-foreground/70 mt-2">Ask a grown-up to add some!</p>
          </div>
        ) : (
          sortedRewards.map((reward, index) => {
            const canAfford = points >= reward.points_cost
            const progress = Math.min((points / reward.points_cost) * 100, 100)
            const pointsNeeded = reward.points_cost - points

            return (
              <button
                key={reward.id}
                onClick={() => canAfford && handleRedeem(reward)}
                onMouseEnter={() =>
                  speak(canAfford ? `Get ${reward.name}!` : `${reward.name}. You need ${pointsNeeded} more points.`)
                }
                onTouchStart={() =>
                  speak(canAfford ? `Get ${reward.name}!` : `${reward.name}. You need ${pointsNeeded} more points.`)
                }
                disabled={!canAfford || isRedeeming}
                className={`relative w-full rounded-3xl p-5 text-left transition-all duration-200 ${
                  canAfford
                    ? "bg-gradient-to-r from-card to-card/80 border-2 border-[var(--star-gold)] hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-card/50 border border-border/50 opacity-80"
                }`}
                style={{
                  boxShadow: canAfford ? "0 8px 24px oklch(0.85 0.15 90 / 0.3)" : "none",
                }}
              >
                <div className="flex items-center gap-5">
                  {/* Reward Image/Icon */}
                  <div className={`relative flex-shrink-0 ${canAfford ? "" : "grayscale"}`}>
                    {reward.image_url ? (
                      <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-border">
                        <img
                          src={reward.image_url || "/placeholder.svg"}
                          alt={reward.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-2xl ${
                          canAfford ? "bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-pink)]" : "bg-muted"
                        }`}
                      >
                        <Gift className="h-12 w-12 text-white" />
                      </div>
                    )}

                    {/* Lock icon if can't afford */}
                    {!canAfford && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                        <Lock className="h-10 w-10 text-white" />
                      </div>
                    )}

                    {/* Sparkle if can afford */}
                    {canAfford && (
                      <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-[var(--star-gold)] animate-pulse" />
                    )}
                  </div>

                  {/* Reward Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold truncate">{reward.name}</h3>
                    {reward.description && (
                      <p className="text-base text-muted-foreground truncate mt-1">{reward.description}</p>
                    )}

                    {/* Points Cost */}
                    <div className="flex items-center gap-2 mt-3">
                      <Star className="h-6 w-6 text-[var(--star-gold)] fill-current" />
                      <span className="text-xl font-bold text-[var(--star-gold)]">{reward.points_cost}</span>
                      <span className="text-base text-muted-foreground">points</span>
                    </div>

                    {/* Progress Bar */}
                    {!canAfford && (
                      <div className="mt-3">
                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--space-cyan)] to-[var(--space-purple)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Need {pointsNeeded} more!</p>
                      </div>
                    )}
                  </div>

                  {/* Get Button */}
                  {canAfford && (
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--star-gold)] to-[oklch(0.75_0.18_60)] flex items-center justify-center text-[oklch(0.15_0.02_60)] font-bold text-lg">
                        GET!
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </main>
  )
}
