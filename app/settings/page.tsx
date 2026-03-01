import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsContent } from "@/components/settings-content"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your ApplyFlow account settings, subscription, and preferences.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  return <SettingsContent user={user} profile={profile} />
}
