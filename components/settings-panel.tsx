"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Profile } from "@/lib/types"
import { Lock, User, Check, Star, Plus, Minus } from "lucide-react"

interface SettingsPanelProps {
  profile: Profile
}

export function SettingsPanel({ profile }: SettingsPanelProps) {
  const [childName, setChildName] = useState(profile.child_name)
  const [childAge, setChildAge] = useState(profile.child_age?.toString() || "")
  const [passcode, setPasscode] = useState(["", "", "", ""])
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [totalPoints, setTotalPoints] = useState(profile.total_points.toString())
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false)

  const handlePasscodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const updated = [...passcode]
      updated[index] = value
      setPasscode(updated)

      if (value && index < 3) {
        const nextInput = document.getElementById(`settings-passcode-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      await supabase
        .from("profiles")
        .update({
          child_name: childName,
          child_age: childAge ? Number.parseInt(childAge) : null,
        })
        .eq("id", profile.id)

      setSavedMessage("Profile saved!")
      setTimeout(() => setSavedMessage(null), 2000)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePasscode = async () => {
    const newPasscode = passcode.join("")
    if (newPasscode.length !== 4) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      await supabase.from("profiles").update({ caregiver_passcode: newPasscode }).eq("id", profile.id)

      setSavedMessage("Passcode changed!")
      setPasscode(["", "", "", ""])
      setTimeout(() => setSavedMessage(null), 2000)
    } catch (error) {
      console.error("Failed to change passcode:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdjustPoints = async () => {
    const points = Number.parseInt(totalPoints)
    if (isNaN(points) || points < 0) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      await supabase.from("profiles").update({ total_points: points }).eq("id", profile.id)

      setSavedMessage("Points updated!")
      setIsAdjustingPoints(false)
      setTimeout(() => setSavedMessage(null), 2000)
    } catch (error) {
      console.error("Failed to update points:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePointsChange = (delta: number) => {
    const current = Number.parseInt(totalPoints) || 0
    const newValue = Math.max(0, current + delta)
    setTotalPoints(newValue.toString())
  }

  return (
    <div className="space-y-4">
      {savedMessage && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/20 p-3 text-green-400">
          <Check className="h-4 w-4" />
          <span className="text-sm">{savedMessage}</span>
        </div>
      )}

      {/* Child Profile */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Child Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="childName">Name</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="bg-input/50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="childAge">Age</Label>
            <Input
              id="childAge"
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              className="bg-input/50"
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Points Adjustment */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Points Management
          </CardTitle>
          <CardDescription>Manually adjust total points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdjustingPoints ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePointsChange(-10)}
                  className="h-12 w-12"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(e.target.value)}
                    className="h-14 w-32 text-center text-2xl font-bold bg-input/50"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">Total Points</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePointsChange(10)}
                  className="h-12 w-12"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdjustingPoints(false)
                    setTotalPoints(profile.total_points.toString())
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustPoints}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
                >
                  Save Points
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Current Points</p>
                  <p className="text-2xl font-bold text-[var(--star-gold)]">{profile.total_points}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdjustingPoints(true)
                    setTotalPoints(profile.total_points.toString())
                  }}
                >
                  Adjust Points
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Passcode */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Change Passcode
          </CardTitle>
          <CardDescription>Enter a new 4-digit passcode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-3">
            {passcode.map((digit, index) => (
              <Input
                key={index}
                id={`settings-passcode-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePasscodeChange(index, e.target.value)}
                className="h-12 w-12 text-center text-xl font-bold bg-input/50"
              />
            ))}
          </div>
          <Button
            onClick={handleChangePasscode}
            disabled={isSaving || passcode.some((d) => !d)}
            variant="outline"
            className="w-full"
          >
            Update Passcode
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
