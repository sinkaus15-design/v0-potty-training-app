import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RewardsStore } from "@/components/rewards-store"

export default async function RewardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch profile using maybeSingle() to avoid error when no profile exists
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    redirect("/onboarding")
  }

  // Fetch active rewards
  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .order("points_cost", { ascending: true })

  return (
    <RewardsStore
      childName={profile.child_name}
      totalPoints={profile.total_points}
      rewards={rewards || []}
      userId={user.id}
    />
  )
}
