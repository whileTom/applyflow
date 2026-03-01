import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for ApplyFlow. Start with 3 free resume optimizations. Buy credit packs or go unlimited with our Pro plan.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | ApplyFlow",
    description:
      "Simple, transparent pricing for ApplyFlow. Start free, then pay as you go or subscribe for unlimited access.",
    url: "/pricing",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
