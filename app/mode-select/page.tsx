import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ModeSelector } from "@/components/mode-selector"
import { StarField } from "@/components/star-field"

export default async function ModeSelectPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get profile (for passcode and backward compatibility)
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // Get children (new multi-child support)
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  // If no profile and no children, redirect to onboarding
  if (!profile && (!children || children.length === 0)) {
    redirect("/onboarding")
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      <StarField />
      <div className="relative z-10 w-full max-w-sm">
        <ModeSelector profile={profile} children={children || []} />
      </div>
    </main>
  )
}
