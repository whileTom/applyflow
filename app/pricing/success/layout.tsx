import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your payment was successful. Credits have been added to your account.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
