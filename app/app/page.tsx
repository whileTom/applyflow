import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ResumeOptimizerWrapper } from "@/components/resume-optimizer-wrapper"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AppPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login?redirect=/app")
  }

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  return <ResumeOptimizerWrapper user={user} profile={profile} />
}
