"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Caregiver } from "@/lib/types"
import { Plus, User, Trash2, Bell, BellOff } from "lucide-react"

interface CaregiversManagerProps {
  caregivers: Caregiver[]
  profileId: string
  onCaregiversChange: (caregivers: Caregiver[]) => void
}

export function CaregiversManager({ caregivers, profileId, onCaregiversChange }: CaregiversManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newCaregiver, setNewCaregiver] = useState({ name: "", email: "", phone: "" })
  const [isLoading, setIsLoading] = useState(false)

  const handleAddCaregiver = async () => {
    if (!newCaregiver.name.trim()) return
    setIsLoading(true)

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("caregivers")
        .insert({
          profile_id: profileId,
          name: newCaregiver.name,
          email: newCaregiver.email || null,
          phone: newCaregiver.phone || null,
        })
        .select()
        .single()

      if (error) throw error

      onCaregiversChange([...caregivers, data])
      setNewCaregiver({ name: "", email: "", phone: "" })
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to add caregiver:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleNotifications = async (caregiver: Caregiver) => {
    const supabase = createClient()

    try {
      await supabase
        .from("caregivers")
        .update({ receive_notifications: !caregiver.receive_notifications })
        .eq("id", caregiver.id)

      onCaregiversChange(
        caregivers.map((c) => (c.id === caregiver.id ? { ...c, receive_notifications: !c.receive_notifications } : c)),
      )
    } catch (error) {
      console.error("Failed to toggle notifications:", error)
    }
  }

  const handleDeleteCaregiver = async (caregiverId: string) => {
    if (caregivers.length <= 1) {
      alert("You must have at least one caregiver")
      return
    }

    const supabase = createClient()

    try {
      await supabase.from("caregivers").delete().eq("id", caregiverId)
      onCaregiversChange(caregivers.filter((c) => c.id !== caregiverId))
    } catch (error) {
      console.error("Failed to delete caregiver:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Caregivers</h2>
          <p className="text-sm text-muted-foreground">Manage who can receive notifications</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Caregiver</DialogTitle>
              <DialogDescription>Add another person who can help manage requests</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cg-name">Name</Label>
                <Input
                  id="cg-name"
                  placeholder="Caregiver name"
                  value={newCaregiver.name}
                  onChange={(e) => setNewCaregiver({ ...newCaregiver, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cg-email">Email (optional)</Label>
                <Input
                  id="cg-email"
                  type="email"
                  placeholder="email@example.com"
                  value={newCaregiver.email}
                  onChange={(e) => setNewCaregiver({ ...newCaregiver, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cg-phone">Phone (optional)</Label>
                <Input
                  id="cg-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newCaregiver.phone}
                  onChange={(e) => setNewCaregiver({ ...newCaregiver, phone: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleAddCaregiver}
              disabled={isLoading || !newCaregiver.name.trim()}
              className="w-full bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)]"
            >
              {isLoading ? "Adding..." : "Add Caregiver"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {caregivers.map((caregiver) => (
          <Card key={caregiver.id} className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--space-blue)]/20 text-[var(--space-blue)]">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{caregiver.name}</p>
                {caregiver.email && <p className="text-xs text-muted-foreground">{caregiver.email}</p>}
                {caregiver.phone && <p className="text-xs text-muted-foreground">{caregiver.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleNotifications(caregiver)}
                  className={`h-9 w-9 ${caregiver.receive_notifications ? "text-[var(--space-cyan)]" : "text-muted-foreground"}`}
                >
                  {caregiver.receive_notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCaregiver(caregiver.id)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  disabled={caregivers.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
