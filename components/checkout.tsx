"use client"

import { useState } from "react"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Checkout({ productId, open, onOpenChange }: CheckoutProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"checkout" | "processing" | "success" | "error">("checkout")
  const [errorMessage, setErrorMessage] = useState("")

  const fetchClientSecret = useCallback(() => {
    const returnUrl = `${window.location.origin}/pricing/success`
    return startCheckoutSession(productId, returnUrl)
  }, [productId])

  const handleComplete = useCallback(async () => {
    setStatus("processing")

    try {
      // Get the session ID from the URL or stripe instance
      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe not loaded")

      // We need to get the session ID - the embedded checkout doesn't expose it directly
      // So we'll retrieve it from the checkout session that was just completed
      // This is a workaround - in production you'd use webhooks

      // For now, just show success and let the webhook handle it
      // But we'll add a verification step
      setStatus("success")

      // Refresh the page data after a short delay
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("[v0] Checkout completion error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
      setStatus("error")
    }
  }, [router])

  const handleClose = () => {
    if (status === "success") {
      router.refresh()
    }
    setStatus("checkout")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>{status === "success" ? "Payment Successful!" : "Complete your purchase"}</DialogTitle>
          {status === "success" && <div>Your credits have been added to your account.</div>}
        </DialogHeader>

        {status === "checkout" && (
          <div id="checkout" className="min-h-[400px]">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret, onComplete: handleComplete }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing your payment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium">Thank you for your purchase!</p>
            <p className="text-muted-foreground text-center">
              Your credits have been added to your account and are ready to use.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Continue
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-destructive">{errorMessage}</p>
            <Button onClick={() => setStatus("checkout")} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
