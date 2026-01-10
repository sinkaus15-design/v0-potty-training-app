"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, ChevronLeft, User, Users, Lock } from "lucide-react"

interface OnboardingFormProps {
  userId: string
}

type Step = "child" | "caregivers" | "passcode"

interface CaregiverInput {
  name: string
  email: string
  phone: string
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("child")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Child info
  const [childName, setChildName] = useState("")
  const [childAge, setChildAge] = useState("")

  // Caregivers
  const [caregivers, setCaregivers] = useState<CaregiverInput[]>([{ name: "", email: "", phone: "" }])

  // Passcode
  const [passcode, setPasscode] = useState(["", "", "", ""])

  const addCaregiver = () => {
    setCaregivers([...caregivers, { name: "", email: "", phone: "" }])
  }

  const updateCaregiver = (index: number, field: keyof CaregiverInput, value: string) => {
    const updated = [...caregivers]
    updated[index][field] = value
    setCaregivers(updated)
  }

  const removeCaregiver = (index: number) => {
    if (caregivers.length > 1) {
      setCaregivers(caregivers.filter((_, i) => i !== index))
    }
  }

  const handlePasscodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const updated = [...passcode]
      updated[index] = value
      setPasscode(updated)

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`passcode-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handlePasscodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      const prevInput = document.getElementById(`passcode-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const fullPasscode = passcode.join("")

    if (fullPasscode.length !== 4) {
      setError("Please enter a 4-digit passcode")
      setIsLoading(false)
      return
    }

    try {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        child_name: childName,
        child_age: childAge ? Number.parseInt(childAge) : null,
        caregiver_passcode: fullPasscode,
        total_points: 0,
      })

      if (profileError) throw profileError

      // Create caregivers
      const validCaregivers = caregivers.filter((c) => c.name.trim())
      if (validCaregivers.length > 0) {
        const { error: caregiversError } = await supabase.from("caregivers").insert(
          validCaregivers.map((c) => ({
            profile_id: userId,
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
          })),
        )

        if (caregiversError) throw caregiversError
      }

      // Create default rewards
      const { error: rewardsError } = await supabase.from("rewards").insert([
        {
          profile_id: userId,
          name: "Extra Screen Time",
          description: "15 minutes of extra screen time",
          points_cost: 50,
          icon: "monitor",
        },
        {
          profile_id: userId,
          name: "Favorite Snack",
          description: "Pick your favorite snack",
          points_cost: 30,
          icon: "cookie",
        },
        {
          profile_id: userId,
          name: "Stay Up Late",
          description: "Stay up 30 minutes past bedtime",
          points_cost: 100,
          icon: "moon",
        },
        {
          profile_id: userId,
          name: "Pick Dinner",
          description: "Choose what's for dinner",
          points_cost: 75,
          icon: "utensils",
        },
      ])

      if (rewardsError) throw rewardsError

      router.push("/mode-select")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to complete setup")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex gap-2">
          {["child", "caregivers", "passcode"].map((s, i) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s === step
                  ? "bg-primary"
                  : i < ["child", "caregivers", "passcode"].indexOf(step)
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
        <CardTitle className="text-2xl">
          {step === "child" && "Who's the Star?"}
          {step === "caregivers" && "Add Caregivers"}
          {step === "passcode" && "Set Passcode"}
        </CardTitle>
        <CardDescription>
          {step === "child" && "Tell us about the child using PottyPal"}
          {step === "caregivers" && "Who will receive bathroom notifications?"}
          {step === "passcode" && "Caregivers will use this to access settings"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "child" && (
          <div className="flex flex-col gap-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)]">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="childName">Child's Name</Label>
              <Input
                id="childName"
                placeholder="Enter name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="h-12 bg-input/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="childAge">Age (optional)</Label>
              <Input
                id="childAge"
                type="number"
                placeholder="Enter age"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="h-12 bg-input/50"
              />
            </div>
            <Button
              onClick={() => setStep("caregivers")}
              disabled={!childName.trim()}
              className="h-12 bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "caregivers" && (
          <div className="flex flex-col gap-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)]">
              <Users className="h-10 w-10 text-primary-foreground" />
            </div>

            <div className="max-h-64 space-y-4 overflow-y-auto">
              {caregivers.map((caregiver, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Caregiver {index + 1}</span>
                    {caregivers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCaregiver(index)}
                        className="h-8 text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Name"
                    value={caregiver.name}
                    onChange={(e) => updateCaregiver(index, "name", e.target.value)}
                    className="h-11 bg-input/50"
                  />
                  <Input
                    type="email"
                    placeholder="Email (optional)"
                    value={caregiver.email}
                    onChange={(e) => updateCaregiver(index, "email", e.target.value)}
                    className="h-11 bg-input/50"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={caregiver.phone}
                    onChange={(e) => updateCaregiver(index, "phone", e.target.value)}
                    className="h-11 bg-input/50"
                  />
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addCaregiver} className="h-11 bg-transparent">
              + Add Another Caregiver
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("child")} className="h-12 flex-1">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep("passcode")}
                disabled={!caregivers.some((c) => c.name.trim())}
                className="h-12 flex-1 bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "passcode" && (
          <div className="flex flex-col gap-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)]">
              <Lock className="h-10 w-10 text-primary-foreground" />
            </div>

            <div className="flex justify-center gap-3">
              {passcode.map((digit, index) => (
                <Input
                  key={index}
                  id={`passcode-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(index, e.target.value)}
                  onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                  className="h-16 w-16 text-center text-2xl font-bold bg-input/50"
                />
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              This passcode protects caregiver settings. Share it only with trusted adults.
            </p>

            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("caregivers")} className="h-12 flex-1">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || passcode.some((d) => !d)}
                className="h-12 flex-1 bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
