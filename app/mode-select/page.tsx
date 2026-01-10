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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    redirect("/onboarding")
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      <StarField />
      <div className="relative z-10 w-full max-w-sm">
        <ModeSelector childName={profile.child_name} />
      </div>
    </main>
  )
}
