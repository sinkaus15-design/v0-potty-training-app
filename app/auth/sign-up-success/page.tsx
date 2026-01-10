import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StarField } from "@/components/star-field"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6">
      <StarField />

      <div className="relative z-10 w-full max-w-sm">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--space-purple)] to-[var(--space-blue)]">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We sent you a confirmation link. Click it to activate your account and start your adventure!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="h-12 w-full bg-transparent">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
