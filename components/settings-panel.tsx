"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Profile } from "@/lib/types"
import { Lock, User, Check } from "lucide-react"

interface SettingsPanelProps {
  profile: Profile
}

export function SettingsPanel({ profile }: SettingsPanelProps) {
  const [childName, setChildName] = useState(profile.child_name)
  const [childAge, setChildAge] = useState(profile.child_age?.toString() || "")
  const [passcode, setPasscode] = useState(["", "", "", ""])
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

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
