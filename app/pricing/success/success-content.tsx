"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { verifyAndFulfillOrder } from "@/app/actions/stripe"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      setMessage("No session ID found")
      return
    }

    const fulfillOrder = async () => {
      try {
        const result = await verifyAndFulfillOrder(sessionId)
        setStatus("success")
        if (result.alreadyFulfilled) {
          setMessage("Your order was already processed.")
        } else if (result.credits && result.credits > 0) {
          setMessage(`${result.credits} credit${result.credits > 1 ? "s" : ""} added to your account!`)
        } else {
          setMessage("Your subscription is now active!")
        }
      } catch (error) {
        console.error("[v0] Order fulfillment error:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Something went wrong")
      }
    }

    fulfillOrder()
  }, [sessionId])

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Processing your order...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl bg-transparent">
              <Link href="/pricing">Buy more credits</Link>
            </Button>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/pricing">Try again</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl bg-transparent">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
