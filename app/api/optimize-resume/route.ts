import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import mammoth from "mammoth"

export const maxDuration = 60

export async function POST(req: Request) {
  console.log("[API] Resume optimization request received")

  try {
    const formData = await req.formData()
    const jobDescription = formData.get("jobDescription") as string
    const resumeFile = formData.get("resume") as File
    const apiKey = formData.get("apiKey") as string

    if (!apiKey || !apiKey.trim()) {
      console.log("[API] Error: Missing API key")
      return Response.json({ error: "Google Gemini API key is required. Please enter your API key." }, { status: 400 })
    }

    if (!jobDescription) {
      console.log("[API] Error: Missing job description")
      return Response.json(
        { error: "Job description is required. Please paste the job listing you want to target." },
        { status: 400 },
      )
    }

    if (!resumeFile) {
      console.log("[API] Error: Missing resume file")
      return Response.json(
        { error: "Resume file is required. Please upload your resume in .docx format." },
        { status: 400 },
      )
    }

    console.log("[API] Inputs validated. File:", resumeFile.name, "Size:", resumeFile.size, "bytes")

    // Convert the file to an ArrayBuffer and then to Buffer
    let buffer: Buffer
    try {
      const arrayBuffer = await resumeFile.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      console.log("[API] File buffer created successfully")
    } catch (fileError) {
      console.log("[API] Error reading file:", fileError)
      return Response.json(
        { error: "Failed to read the uploaded file. Please ensure it's a valid .docx file and try again." },
        { status: 400 },
      )
    }

    // Extract text from DOCX using mammoth
    let resumeText: string
    try {
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
      console.log("[API] Text extracted from DOCX. Character count:", resumeText.length)

      if (result.messages && result.messages.length > 0) {
        console.log("[API] Mammoth warnings:", result.messages)
      }
    } catch (mammothError) {
      console.log("[API] Mammoth extraction error:", mammothError)
      return Response.json(
        {
          error:
            "Failed to extract text from the document. Please ensure the file is a valid .docx file and not password protected.",
        },
        { status: 400 },
      )
    }

    if (!resumeText.trim()) {
      console.log("[API] Error: Extracted text is empty")
      return Response.json(
        {
          error:
            "The uploaded document appears to be empty or contains no extractable text. Please check your file and try again.",
        },
        { status: 400 },
      )
    }

    const prompt = `ROLE: Professional Resume Optimizer

TASK: Rewrite the provided resume to align with the job description requirements.

CONSTRAINTS:
1. Do not fabricate job titles, company names, dates, or contact details.
2. Maintain the existing structure (Summary, Experience, Education).
3. Use high-impact action verbs and industry-specific keywords found in the job description.
4. Provide the response in PLAIN TEXT format (no markdown bolding or stars).
5. It's okay to remove sections that are not relevant to the job description.
7. It's okay to remove or add bullet points as needed to match the job description.
8. It's okay to remove or add entire sections as needed to match the job description.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}`

    console.log("[API] Calling Google Gemini API...")

    try {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey,
      })

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt,
        maxOutputTokens: 4000,
        temperature: 0.3,
      })
      console.log(prompt)
      console.log("[API] Gemini response received. Output length:", text.length, "characters")

      return Response.json({ optimizedResume: text })
    } catch (aiError: unknown) {
      console.log("[API] Gemini API error:", aiError)

      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid")) {
        return Response.json(
          { error: "Invalid API key. Please check your Google Gemini API key and try again." },
          { status: 401 },
        )
      }

      if (errorMessage.includes("quota") || errorMessage.includes("QUOTA_EXCEEDED")) {
        return Response.json(
          { error: "API quota exceeded. Please check your Google AI Studio usage limits or try again later." },
          { status: 429 },
        )
      }

      if (errorMessage.includes("PERMISSION_DENIED")) {
        return Response.json(
          { error: "Permission denied. Please ensure your API key has access to the Gemini API." },
          { status: 403 },
        )
      }

      if (errorMessage.includes("timeout") || errorMessage.includes("DEADLINE_EXCEEDED")) {
        return Response.json(
          { error: "Request timed out. The resume may be too long. Please try with a shorter document." },
          { status: 504 },
        )
      }

      return Response.json({ error: `AI processing failed: ${errorMessage}. Please try again.` }, { status: 500 })
    }
  } catch (error) {
    console.log("[API] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: `An unexpected error occurred: ${errorMessage}. Please try again.` }, { status: 500 })
  }
}
