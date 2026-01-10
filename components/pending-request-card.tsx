"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BathroomRequest } from "@/lib/types"
import { Check, X, Droplets, CircleDot, Star } from "lucide-react"

interface PendingRequestCardProps {
  request: BathroomRequest
  childName: string
  profileId: string
}

export function PendingRequestCard({ request, childName, profileId }: PendingRequestCardProps) {
  const [points, setPoints] = useState("10")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleComplete = async () => {
    setIsProcessing(true)
    const supabase = createClient()
    const pointsNum = Number.parseInt(points) || 10

    try {
      // Update request status
      await supabase
        .from("bathroom_requests")
        .update({
          status: "completed",
          points_awarded: pointsNum,
          completed_at: new Date().toISOString(),
        })
        .eq("id", request.id)

      // Update total points
      await supabase.rpc("increment_points", {
        user_id: profileId,
        points_to_add: pointsNum,
      })
    } catch (error) {
      console.error("Failed to complete request:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    setIsProcessing(true)
    const supabase = createClient()

    try {
      await supabase
        .from("bathroom_requests")
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", request.id)
    } catch (error) {
      console.error("Failed to cancel request:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const timeSince = () => {
    const seconds = Math.floor((Date.now() - new Date(request.created_at).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <Card className="border-2 border-[var(--space-purple)] bg-card/90 animate-pulse-glow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                request.request_type === "pee"
                  ? "bg-gradient-to-br from-[var(--space-cyan)] to-[var(--space-blue)]"
                  : "bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-pink)]"
              }`}
            >
              {request.request_type === "pee" ? (
                <Droplets className="h-7 w-7 text-white" />
              ) : (
                <CircleDot className="h-7 w-7 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold capitalize">{request.request_type} Request</h3>
              <p className="text-sm text-muted-foreground">{childName} needs help</p>
              <p className="text-xs text-muted-foreground/70">{timeSince()}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor={`points-${request.id}`} className="text-sm">
              Points to award:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`points-${request.id}`}
                type="number"
                min="0"
                max="100"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="h-9 w-20 bg-input/50 text-center"
              />
              <Star className="h-4 w-4 text-[var(--star-gold)]" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleComplete}
              disabled={isProcessing}
              className="h-12 flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
            >
              <Check className="mr-2 h-5 w-5" />
              Complete
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="h-12 border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
