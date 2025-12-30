import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

// GET - Fetch all history records
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("resume_history").select("*").order("created_at", { ascending: false })

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
    const body = await request.json()
    const { jobTitle, companyName, jobDescription, generatedResumeDocx } = body

    if (!jobTitle || !companyName || !jobDescription || !generatedResumeDocx) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Upsert - insert or update if job_title + company_name already exists
    const { data, error } = await supabase
      .from("resume_history")
      .upsert(
        {
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription,
          generated_resume_docx: generatedResumeDocx,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "job_title,company_name",
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Missing record ID" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("resume_history").delete().eq("id", id)

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
