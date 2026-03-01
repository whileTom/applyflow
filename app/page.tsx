import type { Metadata } from "next"
import HomePageClient from "./HomePageClient"

const APP_VERSION = "3.1.0"

export const metadata: Metadata = {
  title: "ApplyFlow - AI-Powered Resume Optimization | Land Your Dream Job",
  description:
    "ApplyFlow uses advanced AI to tailor your resume for each job posting, generate interview guides, and help you stand out from the competition. Start with 3 free optimizations.",
  alternates: {
    canonical: "/",
  },
}

export default function HomePage() {
  return <HomePageClient appVersion={APP_VERSION} />
}
