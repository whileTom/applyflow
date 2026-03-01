import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your ApplyFlow account to access AI-powered resume optimization and interview preparation tools.",
  alternates: {
    canonical: "/auth/login",
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
