"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarField } from "@/components/star-field"
import { PendingRequestCard } from "@/components/pending-request-card"
import { RewardsManager } from "@/components/rewards-manager"
import { CaregiversManager } from "@/components/caregivers-manager"
import { SettingsPanel } from "@/components/settings-panel"
import { PointsDisplay } from "@/components/points-display"
import type { Profile, BathroomRequest, Reward, Caregiver } from "@/lib/types"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { Home, Bell, Clock, Gift, Users, Settings, LogOut } from "lucide-react"

interface CaregiverDashboardProps {
  profile: Profile
  initialPendingRequests: BathroomRequest[]
  initialHistory: BathroomRequest[]
  initialRewards: Reward[]
  initialCaregivers: Caregiver[]
}

export function CaregiverDashboard({
  profile,
  initialPendingRequests,
  initialHistory,
  initialRewards,
  initialCaregivers,
}: CaregiverDashboardProps) {
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests)
  const [history, setHistory] = useState(initialHistory)
  const [rewards, setRewards] = useState(initialRewards)
  const [caregivers, setCaregivers] = useState(initialCaregivers)
  const [totalPoints, setTotalPoints] = useState(profile.total_points)

  // Real-time updates for requests
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("caregiver-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bathroom_requests",
          filter: `profile_id=eq.${profile.id}`,
        },
        async (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          // Only refresh if this is a new request being added
          // If it's an update (status change), we handle it optimistically via onRequestResolved
          if (payload.eventType === "INSERT") {
            const { data: pending } = await supabase
              .from("bathroom_requests")
              .select("*")
              .eq("profile_id", profile.id)
              .eq("status", "pending")
              .order("created_at", { ascending: false })

            if (pending) setPendingRequests(pending)
          } else if (payload.eventType === "UPDATE") {
            // Remove from pending if status changed
            const newStatus = (payload.new as { status?: string })?.status
            const requestId = (payload.new as { id?: string })?.id
            if (newStatus && newStatus !== "pending" && requestId) {
              setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
              // Refresh history to include the updated request
              const { data: hist } = await supabase
                .from("bathroom_requests")
                .select("*")
                .eq("profile_id", profile.id)
                .neq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(20)
              if (hist) setHistory(hist)
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          if (payload.new && typeof payload.new === "object" && "total_points" in payload.new) {
            setTotalPoints(payload.new.total_points as number)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.id])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <main className="relative min-h-svh">
      <StarField />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/mode-select")} className="h-11 w-11">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Button>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-foreground">Caregiver Dashboard</h1>
            <p className="text-xs text-muted-foreground">{profile.child_name}</p>
          </div>

          <PointsDisplay points={totalPoints} size="sm" />
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 p-4">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger value="requests" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
              <Bell className="h-4 w-4" />
              <span className="text-[10px]">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
              <Clock className="h-4 w-4" />
              <span className="text-[10px]">History</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
              <Gift className="h-4 w-4" />
              <span className="text-[10px]">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="caregivers" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              <span className="text-[10px]">Team</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1 py-2 data-[state=active]:bg-background">
              <Settings className="h-4 w-4" />
              <span className="text-[10px]">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="mt-4 space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="border-border/50 bg-card/80">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-center text-muted-foreground">No pending requests</p>
                  <p className="text-center text-sm text-muted-foreground/70">
                    Requests will appear here when {profile.child_name} needs help
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  childName={profile.child_name}
                  profileId={profile.id}
                  onRequestResolved={(requestId) => {
                    // Immediately remove from pending requests - deterministic state update
                    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
                    // Add to history
                    const resolvedRequest = pendingRequests.find((r) => r.id === requestId)
                    if (resolvedRequest) {
                      setHistory((prev) => [resolvedRequest, ...prev].slice(0, 20))
                    }
                  }}
                />
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {history.length === 0 ? (
              <Card className="border-border/50 bg-card/80">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-center text-muted-foreground">No history yet</p>
                </CardContent>
              </Card>
            ) : (
              history.map((request) => (
                <Card key={request.id} className="border-border/50 bg-card/80">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          request.request_type === "pee"
                            ? "bg-[var(--space-cyan)]/20 text-[var(--space-cyan)]"
                            : "bg-[var(--space-purple)]/20 text-[var(--space-purple)]"
                        }`}
                      >
                        {request.request_type === "pee" ? "💧" : "💩"}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{request.request_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          request.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {request.status}
                      </span>
                      {request.points_awarded > 0 && (
                        <p className="mt-1 text-sm text-[var(--star-gold)]">+{request.points_awarded} pts</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-4">
            <RewardsManager rewards={rewards} profileId={profile.id} onRewardsChange={setRewards} />
          </TabsContent>

          {/* Caregivers Tab */}
          <TabsContent value="caregivers" className="mt-4">
            <CaregiversManager caregivers={caregivers} profileId={profile.id} onCaregiversChange={setCaregivers} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            <SettingsPanel profile={profile} />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-12 w-full border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
