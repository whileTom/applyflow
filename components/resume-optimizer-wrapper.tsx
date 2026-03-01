"use client"

import type { User } from "@supabase/supabase-js"
import { ResumeOptimizer } from "./resume-optimizer"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  credits_remaining: number
  default_resume_url: string | null
  google_api_key: string | null
  avatar_url: string | null // Added avatar_url field to interface
}

interface ResumeOptimizerWrapperProps {
  user: User
  profile: UserProfile | null
}

export function ResumeOptimizerWrapper({ user, profile }: ResumeOptimizerWrapperProps) {
  return (
    <ResumeOptimizer
      user={user}
      defaultResumeUrl={profile?.default_resume_url || undefined}
      savedApiKey={profile?.google_api_key || undefined}
      subscriptionStatus={profile?.subscription_status || "free"}
      creditsRemaining={profile?.credits_remaining ?? 0}
      avatarUrl={profile?.avatar_url || null} // Pass avatar_url from profile to ResumeOptimizer
    />
  )
}
