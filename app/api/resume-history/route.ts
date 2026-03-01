import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

// GET - Fetch user's history records
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("resume_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[History API] Error fetching history:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ history: data })
  } catch (err) {
    console.error("[History API] Unexpected error:", err)
    return Response.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}

// POST - Save or update a history record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      jobTitle,
      companyName,
      jobDescription,
      generatedResumePdf,
      interviewGuidePdf,
      model,
      embellishmentLevel,
      styleOptions,
    } = body

    if (!jobTitle || !companyName || !jobDescription || !generatedResumePdf) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upsert with user_id
    const { data, error } = await supabase
      .from("resume_history")
      .upsert(
        {
          user_id: user.id,
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription,
          generated_resume_pdf: generatedResumePdf,
          interview_guide_pdf: interviewGuidePdf || null,
          model: model || null,
          embellishment_level: embellishmentLevel || null,
          style_options: styleOptions || null,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,job_title,company_name",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[History API] Error saving history:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, record: data })
  } catch (err) {
    console.error("[History API] Unexpected error:", err)
    return Response.json({ error: "Failed to save history" }, { status: 500 })
  }
}

// DELETE - Delete a history record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Missing record ID" }, { status: 400 })
    }

    // RLS will ensure user can only delete their own records
    const { error } = await supabase.from("resume_history").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("[History API] Error deleting history:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("[History API] Unexpected error:", err)
    return Response.json({ error: "Failed to delete history" }, { status: 500 })
  }
}
