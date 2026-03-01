import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

// GET - Fetch a specific resume's file data
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_resumes")
      .select("id, name, file_data, is_default")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[User Resumes API] Error fetching resume:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return Response.json({ error: "Resume not found" }, { status: 404 })
    }

    return Response.json({ resume: data })
  } catch (err) {
    console.error("[User Resumes API] Unexpected error:", err)
    return Response.json({ error: "Failed to fetch resume" }, { status: 500 })
  }
}
