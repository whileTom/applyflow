import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SuccessContent } from "./success-content"

function LoadingState() {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 text-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Processing your order...</h1>
      <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
    </div>
  )
}

export default function PricingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="container mx-auto py-16 px-4 max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/applyflow-logo.svg"
              alt="ApplyFlow"
              width={400}
              height={160}
              className="h-24 w-auto mx-auto"
              priority
            />
          </Link>
        </div>

        <Suspense fallback={<LoadingState />}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
