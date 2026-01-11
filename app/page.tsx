import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StarField } from "@/components/star-field"
import { PottyPalLogo } from "@/components/pottypal-logo"

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
        {/* PottyPal Logo */}
        <div className="animate-float">
          <PottyPalLogo size="xl" showText={true} />
          {/* Floating reward icons around the logo */}
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}>
            🎁
          </div>
          <div className="absolute top-1/2 -right-8 text-3xl animate-bounce" style={{ animationDelay: "0.8s", animationDuration: "2.2s" }}>
            🏆
          </div>
        </div>

        {/* Subtitle with more excitement */}
        <div className="space-y-3">
          <p className="text-pretty text-xl font-semibold text-foreground">
            Your space adventure to success! 🌟
          </p>
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
            <span className="animate-pulse">🎉</span>
            <span>Earn rewards, get praise, have fun!</span>
            <span className="animate-pulse">🎉</span>
          </div>
        </div>

        {/* Feature highlights - emphasizing rewards and praise */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-[var(--space-purple)]/20 to-[var(--space-purple)]/5 border border-[var(--space-purple)]/30">
            <div className="text-3xl">⭐</div>
            <p className="text-sm font-semibold">Earn Points</p>
            <p className="text-xs text-muted-foreground">Every success counts!</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-[var(--space-cyan)]/20 to-[var(--space-cyan)]/5 border border-[var(--space-cyan)]/30">
            <div className="text-3xl">🎁</div>
            <p className="text-sm font-semibold">Get Rewards</p>
            <p className="text-xs text-muted-foreground">Unlock fun prizes!</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-[var(--star-gold)]/20 to-[var(--star-gold)]/5 border border-[var(--star-gold)]/30">
            <div className="text-3xl">👏</div>
            <p className="text-sm font-semibold">Feel Proud</p>
            <p className="text-xs text-muted-foreground">You're amazing!</p>
          </div>
        </div>

        {/* CTA Buttons with more visual appeal */}
        <div className="flex w-full max-w-xs flex-col gap-4">
          <Button
            asChild
            size="lg"
            className="h-16 text-xl font-bold bg-gradient-to-r from-[var(--space-purple)] via-[var(--space-pink)] to-[var(--space-cyan)] hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            <Link href="/auth/sign-up" className="flex items-center gap-2">
              <span>🚀</span>
              <span>Start Your Adventure!</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 text-lg border-2 border-[var(--space-purple)]/50 bg-transparent hover:bg-[var(--space-purple)]/10 transition-all"
          >
            <Link href="/auth/login">I have an account</Link>
          </Button>
        </div>

        {/* Encouraging message */}
        <p className="text-sm text-muted-foreground max-w-md">
          Join thousands of kids on their potty training journey! 🌈
        </p>
      </div>
    </main>
  )
}
