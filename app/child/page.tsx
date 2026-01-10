import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChildInterface } from "@/components/child-interface"
import { CelebrationOverlay } from "@/components/celebration-overlay"

export default async function ChildPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    redirect("/onboarding")
  }

  // Check for recently completed requests (within last 30 seconds) to show celebration
  const { data: recentCompleted } = await supabase
    .from("bathroom_requests")
    .select("*")
    .eq("profile_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", new Date(Date.now() - 30000).toISOString())
    .order("completed_at", { ascending: false })
    .limit(1)

  // Check for pending requests
  const { data: pendingRequest } = await supabase
    .from("bathroom_requests")
    .select("*")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const showCelebration = recentCompleted && recentCompleted.length > 0
  const celebrationPoints = showCelebration ? recentCompleted[0].points_awarded : 0

  return (
    <>
      {showCelebration && <CelebrationOverlay pointsEarned={celebrationPoints} childName={profile.child_name} />}
      <ChildInterface
        childName={profile.child_name}
        totalPoints={profile.total_points}
        userId={user.id}
        hasPendingRequest={!!pendingRequest}
        pendingRequestType={pendingRequest?.request_type}
      />
    </>
  )
}
