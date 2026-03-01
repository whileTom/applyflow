import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 })
    }

    // Get current avatar URL to delete old one
    const { data: profile } = await supabase.from("user_profiles").select("avatar_url").eq("id", user.id).single()

    // Delete old avatar if exists
    if (profile?.avatar_url) {
      try {
        await del(profile.avatar_url)
      } catch (e) {
        console.error("Failed to delete old avatar:", e)
      }
    }

    // Upload to Vercel Blob with user-specific path
    const blob = await put(`headshots/${user.id}/${file.name}`, file, {
      access: "public",
    })

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: blob.url })
      .eq("id", user.id)

    if (updateError) {
      // Try to delete uploaded blob if DB update fails
      await del(blob.url)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current avatar URL
    const { data: profile } = await supabase.from("user_profiles").select("avatar_url").eq("id", user.id).single()

    if (profile?.avatar_url) {
      // Delete from Vercel Blob
      await del(profile.avatar_url)

      // Update profile to remove avatar URL
      await supabase.from("user_profiles").update({ avatar_url: null }).eq("id", user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
