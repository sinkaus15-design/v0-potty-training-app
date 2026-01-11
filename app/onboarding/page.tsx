import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/onboarding-form"
import { StarField } from "@/components/star-field"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if already has profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // Handle searchParams - could be string or string[]
  const addChild = searchParams?.addChild
  const isAddingChild = 
    addChild === "true" || 
    (typeof addChild === "string" && addChild !== "") ||
    (Array.isArray(addChild) && addChild.length > 0)

  // If adding a child, allow even if profile exists
  if (profile && !isAddingChild) {
    redirect("/mode-select")
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <OnboardingForm userId={user.id} isAddingChild={isAddingChild} />
      </div>
    </main>
  )
}
