"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Reward } from "@/lib/types"
import { Plus, Gift, Trash2, Star, ImageIcon, X, Camera, Info } from "lucide-react"

interface RewardsManagerProps {
  rewards: Reward[]
  profileId: string
  onRewardsChange: (rewards: Reward[]) => void
}

const SUGGESTED_TIERS = [
  { name: "Small Reward", points: 25, description: "e.g., Sticker, High-five, Small snack" },
  { name: "Medium Reward", points: 50, description: "e.g., 15 min screen time, Favorite snack" },
  { name: "Big Reward", points: 100, description: "e.g., Trip to park, New toy, Special activity" },
]

export function RewardsManager({ rewards, profileId, onRewardsChange }: RewardsManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"select-tier" | "customize">("select-tier")
  const [selectedTier, setSelectedTier] = useState<(typeof SUGGESTED_TIERS)[0] | null>(null)
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    points_cost: "25",
    icon: "gift",
    image_url: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const customRewardsCount = rewards.filter((r) => r.image_url).length
  const canAddCustomReward = customRewardsCount < 3

  const resetForm = () => {
    setStep("select-tier")
    setSelectedTier(null)
    setNewReward({ name: "", description: "", points_cost: "25", icon: "gift", image_url: "" })
    setImagePreview(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-reward-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.url) {
        setNewReward({ ...newReward, image_url: data.url })
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
      setImagePreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const clearImage = () => {
    setImagePreview(null)
    setNewReward({ ...newReward, image_url: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSelectTier = (tier: (typeof SUGGESTED_TIERS)[0]) => {
    setSelectedTier(tier)
    setNewReward({
      ...newReward,
      points_cost: tier.points.toString(),
    })
    setStep("customize")
  }

  const handleAddReward = async () => {
    if (!newReward.name.trim()) return
    setIsLoading(true)

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("rewards")
        .insert({
          profile_id: profileId,
          name: newReward.name,
          description: newReward.description || null,
          points_cost: Number.parseInt(newReward.points_cost) || 25,
          icon: newReward.icon,
          image_url: newReward.image_url || null,
        })
        .select()
        .single()

      if (error) throw error

      onRewardsChange([...rewards, data])
      resetForm()
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to add reward:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (reward: Reward) => {
    const supabase = createClient()

    try {
      await supabase.from("rewards").update({ is_active: !reward.is_active }).eq("id", reward.id)
      onRewardsChange(rewards.map((r) => (r.id === reward.id ? { ...r, is_active: !r.is_active } : r)))
    } catch (error) {
      console.error("Failed to toggle reward:", error)
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    const supabase = createClient()

    try {
      await supabase.from("rewards").delete().eq("id", rewardId)
      onRewardsChange(rewards.filter((r) => r.id !== rewardId))
    } catch (error) {
      console.error("Failed to delete reward:", error)
    }
  }

  // Sort rewards by points
  const sortedRewards = [...rewards].sort((a, b) => a.points_cost - b.points_cost)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Rewards</h2>
          <p className="text-sm text-muted-foreground">Set up motivating rewards</p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]">
              <Plus className="mr-1 h-4 w-4" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{step === "select-tier" ? "Choose Reward Size" : "Customize Reward"}</DialogTitle>
            </DialogHeader>

            {step === "select-tier" ? (
              <div className="space-y-3 py-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>
                    We suggest spacing rewards at 25, 50, and 100 points to give achievable short-term and exciting
                    long-term goals.
                  </p>
                </div>

                {SUGGESTED_TIERS.map((tier) => (
                  <button
                    key={tier.points}
                    onClick={() => handleSelectTier(tier)}
                    className="w-full p-4 rounded-xl border border-border bg-card hover:border-[var(--space-purple)] transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{tier.name}</span>
                      <div className="flex items-center gap-1 text-[var(--star-gold)]">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="font-bold">{tier.points}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setSelectedTier(null)
                    setStep("customize")
                  }}
                  className="w-full p-3 rounded-xl border border-dashed border-border hover:border-[var(--space-purple)] transition-colors text-center text-muted-foreground"
                >
                  Custom points amount
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {selectedTier && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--space-purple)]/10 border border-[var(--space-purple)]/30">
                    <Star className="h-5 w-5 text-[var(--star-gold)] fill-current" />
                    <span className="font-medium">{selectedTier.name}</span>
                    <span className="text-[var(--star-gold)] font-bold ml-auto">{selectedTier.points} pts</span>
                  </div>
                )}

                {/* Photo Upload */}
                {canAddCustomReward && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Add a Photo
                      <span className="text-xs text-muted-foreground">(makes it more exciting!)</span>
                    </Label>
                    {imagePreview ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Reward preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={clearImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-[var(--space-purple)] transition-colors bg-muted/30"
                      >
                        {isUploading ? (
                          <div className="animate-spin h-8 w-8 border-2 border-[var(--space-purple)] border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Tap to upload photo</span>
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">{customRewardsCount}/3 photo rewards used</p>
                  </div>
                )}

                {/* Reward Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">What is the reward?</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Extra Screen Time, Trip to Park"
                    value={newReward.name}
                    onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>

                {/* Description (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="description">Details (optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., 15 minutes of tablet time"
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  />
                </div>

                {/* Custom Points (if not using tier) */}
                {!selectedTier && (
                  <div className="space-y-2">
                    <Label htmlFor="points">Points Required</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={newReward.points_cost}
                      onChange={(e) => setNewReward({ ...newReward, points_cost: e.target.value })}
                      className="h-12 text-base"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep("select-tier")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleAddReward}
                    disabled={isLoading || !newReward.name.trim() || isUploading}
                    className="flex-1 bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
                  >
                    {isLoading ? "Adding..." : "Add Reward"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Rewards */}
      <div className="space-y-3">
        {sortedRewards.length === 0 ? (
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-base font-medium text-muted-foreground">No rewards yet</p>
              <p className="text-sm text-muted-foreground/70">Add some to motivate your child!</p>
            </CardContent>
          </Card>
        ) : (
          sortedRewards.map((reward) => (
            <Card
              key={reward.id}
              className={`border-border/50 transition-opacity ${!reward.is_active ? "opacity-50" : ""}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {reward.image_url ? (
                  <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                    <img
                      src={reward.image_url || "/placeholder.svg"}
                      alt={reward.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--space-purple)]/20 text-[var(--space-purple)] flex-shrink-0">
                    <Gift className="h-8 w-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{reward.name}</p>
                  {reward.description && <p className="text-sm text-muted-foreground truncate">{reward.description}</p>}
                  <div className="flex items-center gap-1 mt-1 text-[var(--star-gold)]">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold">{reward.points_cost} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={reward.is_active} onCheckedChange={() => handleToggleActive(reward)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteReward(reward.id)}
                    className="h-10 w-10 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
