import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"
import { extractGoogleDriveDocId } from "@/lib/extract-doc-id"

export const runtime = "nodejs"

// GET - Fetch user's saved resumes
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
      .from("user_resumes")
      .select("id, name, google_drive_doc_id, is_default, created_at, updated_at")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[User Resumes API] Error fetching resumes:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ resumes: data })
  } catch (err) {
    console.error("[User Resumes API] Unexpected error:", err)
    return Response.json({ error: "Failed to fetch resumes" }, { status: 500 })
  }
}

// POST - Save a new resume
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
    const { name, googleDriveUrl, fileData, setAsDefault } = body

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 })
    }

    let docId = null
    if (googleDriveUrl) {
      docId = extractGoogleDriveDocId(googleDriveUrl)
      if (!docId) {
        return Response.json({ error: "Invalid Google Drive URL or DOC_ID" }, { status: 400 })
      }
    }

    if (!docId && !fileData) {
      return Response.json({ error: "Either Google Drive URL or file data is required" }, { status: 400 })
    }

    if (setAsDefault) {
      await supabase.from("user_resumes").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("user_resumes")
      .insert({
        user_id: user.id,
        name,
        google_drive_doc_id: docId,
        file_data: fileData || null,
        is_default: setAsDefault || false,
      })
      .select("id, name, google_drive_doc_id, is_default, created_at")
      .single()

    if (error) {
      console.error("[User Resumes API] Error saving resume:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, resume: data })
  } catch (err) {
    console.error("[User Resumes API] Unexpected error:", err)
    return Response.json({ error: "Failed to save resume" }, { status: 500 })
  }
}

// PATCH - Update resume (set as default)
export async function PATCH(request: NextRequest) {
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
    const { id, setAsDefault } = body

    if (!id) {
      return Response.json({ error: "Missing resume ID" }, { status: 400 })
    }

    if (setAsDefault) {
      await supabase.from("user_resumes").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true)
    }

    const { data, error } = await supabase
      .from("user_resumes")
      .update({ is_default: setAsDefault, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[User Resumes API] Error updating resume:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, resume: data })
  } catch (err) {
    console.error("[User Resumes API] Unexpected error:", err)
    return Response.json({ error: "Failed to update resume" }, { status: 500 })
  }
}

// DELETE - Delete a resume
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
      return Response.json({ error: "Missing resume ID" }, { status: 400 })
    }

    const { error } = await supabase.from("user_resumes").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("[User Resumes API] Error deleting resume:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("[User Resumes API] Unexpected error:", err)
    return Response.json({ error: "Failed to delete resume" }, { status: 500 })
  }
}
