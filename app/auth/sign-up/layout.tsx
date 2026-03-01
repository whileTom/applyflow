import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free ApplyFlow account and get 3 free resume optimizations. No credit card required.",
  alternates: {
    canonical: "/auth/sign-up",
  },
  openGraph: {
    title: "Create Your Free Account | ApplyFlow",
    description: "Get started with 3 free resume optimizations. No credit card required.",
    url: "/auth/sign-up",
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
