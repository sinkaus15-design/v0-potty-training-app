import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CaregiverDashboard } from "@/components/caregiver-dashboard"

export default async function CaregiverPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    redirect("/onboarding")
  }

  // Fetch pending requests
  const { data: pendingRequests } = await supabase
    .from("bathroom_requests")
    .select("*")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Fetch recent history
  const { data: history } = await supabase
    .from("bathroom_requests")
    .select("*")
    .eq("profile_id", user.id)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20)

  // Fetch rewards
  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("profile_id", user.id)
    .order("points_cost", { ascending: true })

  // Fetch caregivers
  const { data: caregivers } = await supabase
    .from("caregivers")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })

  return (
    <CaregiverDashboard
      profile={profile}
      initialPendingRequests={pendingRequests || []}
      initialHistory={history || []}
      initialRewards={rewards || []}
      initialCaregivers={caregivers || []}
    />
  )
}
