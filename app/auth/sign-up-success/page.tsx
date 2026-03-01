import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="text-center mb-4">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                ApplyFlow
              </h1>
            </Link>
          </div>

          <Card className="rounded-3xl bg-card/95 backdrop-blur-xl border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>We sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/30 mb-4">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click the link in your email to activate your account
                </span>
              </div>
              
              {/* Spam folder warning */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-sm text-amber-200 font-medium mb-2">
                  Check your spam/junk folder!
                </p>
                <p className="text-xs text-muted-foreground">
                  The confirmation email will be sent from{" "}
                  <span className="font-mono text-amber-300/80">noreply@mail.app.supabase.io</span>
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {"Didn't receive an email? Check your spam folder or "}
                <Link href="/auth/sign-up" className="text-primary hover:underline underline-offset-4">
                  try again
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
