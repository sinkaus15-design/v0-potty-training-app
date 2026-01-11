"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Gamepad2, Settings, Plus, User, Edit2, Pencil } from "lucide-react"
import type { Child, Profile } from "@/lib/types"
import { PottyPalLogo } from "@/components/pottypal-logo"

interface ModeSelectorProps {
  profile: Profile | null
  children: Child[]
}

export function ModeSelector({ profile, children: initialChildren }: ModeSelectorProps) {
  const router = useRouter()
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState(["", "", "", ""])
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [children, setChildren] = useState(initialChildren)
  const [caregiverDisplayName, setCaregiverDisplayName] = useState("Caregiver Dashboard")
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [editingChildName, setEditingChildName] = useState("")
  const [isEditingCaregiverName, setIsEditingCaregiverName] = useState(false)
  const [tempCaregiverName, setTempCaregiverName] = useState("Caregiver Dashboard")
  const [isSaving, setIsSaving] = useState(false)

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

  // Load children and caregiver display name on mount
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Load children
      const { data: childrenData } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData)
      }

      // Load caregiver display name from profile
      if (profile) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("caregiver_display_name")
            .eq("id", user.id)
            .maybeSingle()

          if (profileData?.caregiver_display_name) {
            setCaregiverDisplayName(profileData.caregiver_display_name)
            setTempCaregiverName(profileData.caregiver_display_name)
          }
        } catch (error) {
          // Column might not exist yet, use default
          console.log("caregiver_display_name column may not exist yet")
        }
      }
    }
    loadData()
  }, [profile])

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("caregiver_passcode")
      .eq("id", user.id)
      .maybeSingle()

    if (profileData?.caregiver_passcode === passcode.join("")) {
      router.push("/caregiver")
    } else {
      setError("Incorrect passcode")
      setPasscode(["", "", "", ""])
      document.getElementById("verify-passcode-0")?.focus()
    }

    setIsVerifying(false)
  }

  const handleChildSelect = (childId: string) => {
    router.push(`/child?childId=${childId}`)
  }

  const handleAddChild = () => {
    router.push("/onboarding?addChild=true")
  }

  const handleEditChildName = async (childId: string) => {
    if (!editingChildName.trim()) return
    setIsSaving(true)

    const supabase = createClient()
    try {
      await supabase
        .from("children")
        .update({ child_name: editingChildName.trim() })
        .eq("id", childId)

      setChildren(children.map((c) => (c.id === childId ? { ...c, child_name: editingChildName.trim() } : c)))
      setEditingChildId(null)
      setEditingChildName("")
    } catch (error) {
      console.error("Failed to update child name:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCaregiverName = async () => {
    if (!tempCaregiverName.trim()) return
    setIsSaving(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !profile) {
      setIsSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ caregiver_display_name: tempCaregiverName.trim() })
        .eq("id", user.id)

      if (error) {
        // If column doesn't exist, inform user they need to run migration
        if (error.message?.includes("column") || error.code === "42703") {
          console.error("caregiver_display_name column does not exist. Please run migration script 004-add-caregiver-display-name.sql")
          alert("Please run the database migration to enable this feature. See scripts/004-add-caregiver-display-name.sql")
          return
        }
        throw error
      }

      setCaregiverDisplayName(tempCaregiverName.trim())
      setIsEditingCaregiverName(false)
    } catch (error) {
      console.error("Failed to update caregiver name:", error)
    } finally {
      setIsSaving(false)
    }
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

  // Determine which children to show
  // If children table has entries, use those. Otherwise fall back to profile.
  const displayChildren = children.length > 0 
    ? children 
    : profile 
      ? [{ id: profile.id, child_name: profile.child_name, user_id: profile.id, child_age: profile.child_age, total_points: profile.total_points, created_at: "", updated_at: "" } as Child]
      : []

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <PottyPalLogo size="lg" showText={true} className="mb-4" />
        <p className="mt-2 text-muted-foreground">Who's using the app?</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Child Mode Buttons - Multiple children support */}
        {displayChildren.map((child) => (
          <div key={child.id} className="relative group">
            <Button
              onClick={() => handleChildSelect(child.id)}
              className="h-28 w-full flex-col gap-2 bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)] hover:opacity-90 transition-opacity animate-pulse-glow"
            >
              <Gamepad2 className="h-10 w-10" />
              {editingChildId === child.id ? (
                <div className="flex items-center gap-2 w-full px-4">
                  <Input
                    value={editingChildName}
                    onChange={(e) => setEditingChildName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleEditChildName(child.id)
                      } else if (e.key === "Escape") {
                        setEditingChildId(null)
                        setEditingChildName("")
                      }
                    }}
                    className="h-8 text-center font-bold bg-background/90"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <span className="text-lg font-bold">{child.child_name}</span>
                  {child.total_points > 0 && (
                    <span className="text-sm opacity-90">{child.total_points} points</span>
                  )}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                setEditingChildId(child.id)
                setEditingChildName(child.child_name)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {editingChildId === child.id && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditChildName(child.id)
                  }}
                  disabled={isSaving || !editingChildName.trim()}
                  className="h-7 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingChildId(null)
                    setEditingChildName("")
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add Child Button - Always show for authenticated users */}
        <Button
          variant="outline"
          onClick={handleAddChild}
          className="h-20 flex-col gap-2 border-dashed border-2 border-muted-foreground/30 hover:border-[var(--space-purple)]"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm">Add Another Child</span>
        </Button>

        {/* Caregiver Mode Button */}
        <div className="relative group">
          <Button
            variant="outline"
            onClick={() => setShowPasscode(true)}
            className="h-20 w-full flex-col gap-2 border-muted-foreground/30"
          >
            <Settings className="h-8 w-8" />
            {isEditingCaregiverName ? (
              <Input
                value={tempCaregiverName}
                onChange={(e) => setTempCaregiverName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSaveCaregiverName()
                  } else if (e.key === "Escape") {
                    setIsEditingCaregiverName(false)
                    setTempCaregiverName(caregiverDisplayName)
                  }
                }}
                className="h-8 text-center font-bold bg-background/90 w-48"
                autoFocus
              />
            ) : (
              <span className="text-base">{caregiverDisplayName}</span>
            )}
          </Button>
          {!isEditingCaregiverName && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingCaregiverName(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {isEditingCaregiverName && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveCaregiverName()
                }}
                disabled={isSaving || !tempCaregiverName.trim()}
                className="h-7 text-xs"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingCaregiverName(false)
                  setTempCaregiverName(caregiverDisplayName)
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
