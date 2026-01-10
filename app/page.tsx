import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StarField } from "@/components/star-field"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, check if they have a profile
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

    if (profile) {
      // Has profile, go to mode selection
      redirect("/mode-select")
    } else {
      // No profile yet, go to onboarding
      redirect("/onboarding")
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      <StarField />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Logo/Icon */}
        <div className="animate-float relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)] animate-pulse-glow">
            <svg className="h-16 w-16 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground">PottyPal</h1>
          <p className="text-pretty text-lg text-muted-foreground">Your space adventure to success!</p>
        </div>

        {/* CTA Buttons */}
        <div className="flex w-full max-w-xs flex-col gap-4">
          <Button
            asChild
            size="lg"
            className="h-14 text-lg bg-gradient-to-r from-[var(--space-purple)] to-[var(--space-blue)] hover:opacity-90 transition-opacity"
          >
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 text-lg border-muted-foreground/30 bg-transparent"
          >
            <Link href="/auth/login">I have an account</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
