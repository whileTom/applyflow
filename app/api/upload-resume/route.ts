import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("resume") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json({ error: "Only .docx files are allowed" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure the resume directory exists
    const resumeDir = join(process.cwd(), "public", "resume")
    if (!existsSync(resumeDir)) {
      await mkdir(resumeDir, { recursive: true })
    }

    // Save as the default resume
    const filePath = join(resumeDir, "default-resume.docx")
    await writeFile(filePath, buffer)

    console.log(`[Upload] Default resume saved: ${file.name} (${buffer.length} bytes)`)

    return NextResponse.json({
      success: true,
      message: "Resume uploaded and set as default for all users",
      filename: file.name,
      size: buffer.length,
    })
  } catch (error) {
    console.error("[Upload] Error saving resume:", error)
    return NextResponse.json({ error: "Failed to save resume file" }, { status: 500 })
  }
}
