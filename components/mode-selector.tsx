"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Gamepad2, Settings } from "lucide-react"

interface ModeSelectorProps {
  childName: string
}

export function ModeSelector({ childName }: ModeSelectorProps) {
  const router = useRouter()
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState(["", "", "", ""])
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handlePasscodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const updated = [...passcode]
      updated[index] = value
      setPasscode(updated)

      if (value && index < 3) {
        const nextInput = document.getElementById(`verify-passcode-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handlePasscodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      const prevInput = document.getElementById(`verify-passcode-${index - 1}`)
      prevInput?.focus()
    }
  }

  const verifyPasscode = async () => {
    setIsVerifying(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Not authenticated")
      setIsVerifying(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("caregiver_passcode")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.caregiver_passcode === passcode.join("")) {
      router.push("/caregiver")
    } else {
      setError("Incorrect passcode")
      setPasscode(["", "", "", ""])
      document.getElementById("verify-passcode-0")?.focus()
    }

    setIsVerifying(false)
  }

  if (showPasscode) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Enter Caregiver Passcode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex justify-center gap-3">
            {passcode.map((digit, index) => (
              <Input
                key={index}
                id={`verify-passcode-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePasscodeChange(index, e.target.value)}
                onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                className="h-14 w-14 text-center text-2xl font-bold bg-input/50"
              />
            ))}
          </div>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasscode(false)
                setPasscode(["", "", "", ""])
                setError(null)
              }}
              className="h-12 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={verifyPasscode}
              disabled={isVerifying || passcode.some((d) => !d)}
              className="h-12 flex-1 bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
            >
              {isVerifying ? "Verifying..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">PottyPal</h1>
        <p className="mt-1 text-muted-foreground">Who's using the app?</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Child Mode Button */}
        <Button
          onClick={() => router.push("/child")}
          className="h-32 flex-col gap-3 bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)] hover:opacity-90 transition-opacity animate-pulse-glow"
        >
          <Gamepad2 className="h-12 w-12" />
          <span className="text-xl font-bold">{childName}</span>
        </Button>

        {/* Caregiver Mode Button */}
        <Button
          variant="outline"
          onClick={() => setShowPasscode(true)}
          className="h-20 flex-col gap-2 border-muted-foreground/30"
        >
          <Settings className="h-8 w-8" />
          <span className="text-base">Caregiver Dashboard</span>
        </Button>
      </div>
    </div>
  )
}
