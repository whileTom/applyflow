import { generateText } from "ai"
import mammoth from "mammoth"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const jobDescription = formData.get("jobDescription") as string
    const resumeFile = formData.get("resume") as File

    if (!jobDescription || !resumeFile) {
      return Response.json({ error: "Job description and resume file are required" }, { status: 400 })
    }

    // Convert the file to an ArrayBuffer and then to Buffer
    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from DOCX using mammoth
    const result = await mammoth.extractRawText({ buffer })
    const resumeText = result.value

    if (!resumeText.trim()) {
      return Response.json({ error: "Could not extract text from the resume file" }, { status: 400 })
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

    const { text } = await generateText({
      model: "google/gemini-2.5-flash",
      prompt,
      maxOutputTokens: 4000,
      temperature: 0.3,
    })

    return Response.json({ optimizedResume: text })
  } catch (error) {
    console.error("Error optimizing resume:", error)
    return Response.json({ error: "Failed to optimize resume. Please try again." }, { status: 500 })
  }
}
