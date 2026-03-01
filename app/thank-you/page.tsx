"use client"

import { useEffect } from "react"
import { trackPurchase } from "@/lib/analytics"

export default function ThankYouPage() {
  useEffect(() => {
    // Track the purchase conversion
    // You can get the transaction details from URL params or local storage
    const urlParams = new URLSearchParams(window.location.search)
    const transactionId = urlParams.get("session_id") || `txn_${Date.now()}`
    const plan = urlParams.get("plan") || "pro"

    // Set value based on plan
    const value = plan === "pro" ? 9.99 : plan === "premium" ? 19.99 : 9.99

    trackPurchase(transactionId, value, "USD")
  }, [])
}
