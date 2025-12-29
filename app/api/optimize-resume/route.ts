import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import mammoth from "mammoth"
import { z } from "zod"
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx"

export const maxDuration = 60

const ResumeSchema = z.object({
  contactInfo: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
  }),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        bullets: z.array(z.string()),
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        location: z.string().optional(),
        graduationDate: z.string().optional(),
        details: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        bullets: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  additionalSections: z
    .array(
      z.object({
        title: z.string(),
        items: z.array(z.string()),
      }),
    )
    .optional(),
})

type ResumeData = z.infer<typeof ResumeSchema>

function generateProfessionalDocx(resume: ResumeData): Document {
  const children: Paragraph[] = []

  // Helper for section headers
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 24 })],
        spacing: { before: 300, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
      }),
    )
  }

  // Contact Info - Name as header
  children.push(
    new Paragraph({
      children: [new TextRun({ text: resume.contactInfo.name, bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
  )

  // Contact details on one line
  const contactParts: string[] = []
  if (resume.contactInfo.email) contactParts.push(resume.contactInfo.email)
  if (resume.contactInfo.phone) contactParts.push(resume.contactInfo.phone)
  if (resume.contactInfo.location) contactParts.push(resume.contactInfo.location)
  if (resume.contactInfo.linkedin) contactParts.push(resume.contactInfo.linkedin)
  if (resume.contactInfo.website) contactParts.push(resume.contactInfo.website)

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join("  |  "), size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    )
  }

  // Summary
  if (resume.summary) {
    addSectionHeader("Professional Summary")
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.summary, size: 22 })],
        spacing: { after: 100 },
      }),
    )
  }

  // Skills - each skill as its own entry
  if (resume.skills && resume.skills.length > 0) {
    addSectionHeader("Skills")
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.skills.join("  •  "), size: 22 })],
        spacing: { after: 100 },
      }),
    )
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader("Professional Experience")
    for (const job of resume.experience) {
      // Job title and company
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.title, bold: true, size: 22 }),
            new TextRun({ text: "  |  ", size: 22 }),
            new TextRun({ text: job.company, italics: true, size: 22 }),
            ...(job.location ? [new TextRun({ text: `  |  ${job.location}`, size: 22 })] : []),
          ],
          spacing: { before: 150, after: 50 },
        }),
      )
      // Dates
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${job.startDate} - ${job.endDate}`, size: 20, italics: true })],
          spacing: { after: 50 },
        }),
      )
      // Bullets
      for (const bullet of job.bullets) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `•  ${bullet}`, size: 22 })],
            indent: { left: 360 },
            spacing: { after: 30 },
          }),
        )
      }
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    addSectionHeader("Education")
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22 }),
            new TextRun({ text: "  |  ", size: 22 }),
            new TextRun({ text: edu.institution, italics: true, size: 22 }),
            ...(edu.location ? [new TextRun({ text: `  |  ${edu.location}`, size: 22 })] : []),
          ],
          spacing: { before: 150, after: 50 },
        }),
      )
      if (edu.graduationDate) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: edu.graduationDate, size: 20, italics: true })],
            spacing: { after: 50 },
          }),
        )
      }
      if (edu.details) {
        for (const detail of edu.details) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `•  ${detail}`, size: 22 })],
              indent: { left: 360 },
              spacing: { after: 30 },
            }),
          )
        }
      }
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    addSectionHeader("Certifications")
    for (const cert of resume.certifications) {
      const certParts = [cert.name]
      if (cert.issuer) certParts.push(cert.issuer)
      if (cert.date) certParts.push(cert.date)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `•  ${certParts.join("  |  ")}`, size: 22 })],
          indent: { left: 360 },
          spacing: { after: 30 },
        }),
      )
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader("Projects")
    for (const project of resume.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: project.name, bold: true, size: 22 }),
            ...(project.technologies && project.technologies.length > 0
              ? [new TextRun({ text: `  (${project.technologies.join(", ")})`, italics: true, size: 20 })]
              : []),
          ],
          spacing: { before: 150, after: 50 },
        }),
      )
      if (project.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: project.description, size: 22 })],
            spacing: { after: 50 },
          }),
        )
      }
      if (project.bullets) {
        for (const bullet of project.bullets) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `•  ${bullet}`, size: 22 })],
              indent: { left: 360 },
              spacing: { after: 30 },
            }),
          )
        }
      }
    }
  }

  // Additional sections
  if (resume.additionalSections && resume.additionalSections.length > 0) {
    for (const section of resume.additionalSections) {
      addSectionHeader(section.title)
      for (const item of section.items) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `•  ${item}`, size: 22 })],
            indent: { left: 360 },
            spacing: { after: 30 },
          }),
        )
      }
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  })
}

export async function POST(req: Request) {
  console.log("[API] Resume optimization request received")
  const requestStartTime = Date.now()

  try {
    const formData = await req.formData()
    const jobDescription = formData.get("jobDescription") as string
    const resumeFile = formData.get("resume") as File
    const apiKey = formData.get("apiKey") as string

    // Validation
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

    // Extract text from DOCX using mammoth
    let resumeText: string
    try {
      const arrayBuffer = await resumeFile.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      resumeText = result.value
      console.log("[API] Extracted text from DOCX:", resumeText.length, "characters")
    } catch (parseError) {
      console.log("[API] Error parsing DOCX:", parseError)
      return Response.json(
        { error: "Failed to parse the DOCX file. Please ensure it's a valid .docx file." },
        { status: 400 },
      )
    }

    if (!resumeText.trim()) {
      console.log("[API] Error: Extracted text is empty")
      return Response.json(
        { error: "The uploaded document appears to be empty or contains no extractable text." },
        { status: 400 },
      )
    }

    const prompt = `ROLE: Professional Resume Optimizer

TASK: Analyze the provided resume and job description, then return an optimized resume as structured JSON data.

CONSTRAINTS:
1. Do not fabricate job titles, company names, dates, or contact details.
2. Use high-impact action verbs and industry-specific keywords from the job description.
3. It's okay to remove sections not relevant to the job description.
4. It's okay to add, remove, or modify bullet points to better match the job description.
5. It's okay to add relevant certifications, projects, or skills sections if they would strengthen the application.
6. Each skill in the skills array should be a SINGLE skill/technology (e.g., "Python", "Project Management", "AWS").
7. Make bullet points concise, achievement-focused, and quantified where possible.
8. Ensure the resume is cohesive, professional, and error-free.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}

Return the optimized resume as structured JSON matching the schema. Ensure all text is clean, professional, and free of special character issues.`

    console.log("[API] Calling Google Gemini API for structured output...")
    const aiStartTime = Date.now()
    const modelName = "gemini-2.5-flash"

    try {
      const google = createGoogleGenerativeAI({ apiKey })

      const { object: resumeData } = await generateObject({
        model: google(modelName),
        schema: ResumeSchema,
        prompt,
        temperature: 0.3,
      })

      const aiProcessingTime = Date.now() - aiStartTime
      console.log("[API] Gemini returned structured resume data")
      console.log("[API] AI processing time:", aiProcessingTime, "ms")

      // Generate DOCX from structured data
      console.log("[API] Generating professional DOCX document...")
      const doc = generateProfessionalDocx(resumeData)
      const docxBuffer = await Packer.toBuffer(doc)
      const docxBase64 = Buffer.from(docxBuffer).toString("base64")

      const totalProcessingTime = Date.now() - requestStartTime
      console.log("[API] DOCX generated successfully, size:", docxBuffer.length, "bytes")
      console.log("[API] Total processing time:", totalProcessingTime, "ms")

      // Format for display
      const displayText = formatResumeForDisplay(resumeData)

      return Response.json({
        optimizedResume: displayText,
        docxBase64,
        structuredData: resumeData,
        debug: {
          prompt,
          resumeTextLength: resumeText.length,
          jobDescriptionLength: jobDescription.length,
          responseLength: displayText.length,
          processingTime: aiProcessingTime,
          totalTime: totalProcessingTime,
          model: `google/${modelName}`,
          extractedResumePreview: resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : ""),
          skillsCount: resumeData.skills?.length || 0,
          experienceCount: resumeData.experience?.length || 0,
        },
      })
    } catch (aiError: unknown) {
      console.log("[API] Gemini API error:", aiError)
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      const debugInfo = {
        prompt,
        resumeTextLength: resumeText.length,
        jobDescriptionLength: jobDescription.length,
        model: `google/${modelName}`,
        extractedResumePreview: resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : ""),
        errorDetails: errorMessage,
      }

      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid")) {
        return Response.json(
          { error: "Invalid API key. Please check your Google Gemini API key and try again.", debug: debugInfo },
          { status: 401 },
        )
      }

      if (errorMessage.includes("quota") || errorMessage.includes("QUOTA_EXCEEDED")) {
        return Response.json(
          {
            error: "API quota exceeded. Please check your Google AI Studio usage limits or try again later.",
            debug: debugInfo,
          },
          { status: 429 },
        )
      }

      if (errorMessage.includes("PERMISSION_DENIED")) {
        return Response.json(
          { error: "Permission denied. Please ensure your API key has access to the Gemini API.", debug: debugInfo },
          { status: 403 },
        )
      }

      return Response.json(
        { error: `AI processing failed: ${errorMessage}. Please try again.`, debug: debugInfo },
        { status: 500 },
      )
    }
  } catch (error) {
    console.log("[API] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: `An unexpected error occurred: ${errorMessage}. Please try again.` }, { status: 500 })
  }
}

// Helper to format resume data for display
function formatResumeForDisplay(resume: ResumeData): string {
  const lines: string[] = []

  lines.push(resume.contactInfo.name)
  const contact = [
    resume.contactInfo.email,
    resume.contactInfo.phone,
    resume.contactInfo.location,
    resume.contactInfo.linkedin,
    resume.contactInfo.website,
  ]
    .filter(Boolean)
    .join(" | ")
  if (contact) lines.push(contact)
  lines.push("")

  if (resume.summary) {
    lines.push("PROFESSIONAL SUMMARY")
    lines.push(resume.summary)
    lines.push("")
  }

  if (resume.skills && resume.skills.length > 0) {
    lines.push("SKILLS")
    lines.push(resume.skills.join(" • "))
    lines.push("")
  }

  if (resume.experience && resume.experience.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE")
    for (const job of resume.experience) {
      lines.push(`${job.title} | ${job.company}${job.location ? ` | ${job.location}` : ""}`)
      lines.push(`${job.startDate} - ${job.endDate}`)
      for (const bullet of job.bullets) {
        lines.push(`• ${bullet}`)
      }
      lines.push("")
    }
  }

  if (resume.education && resume.education.length > 0) {
    lines.push("EDUCATION")
    for (const edu of resume.education) {
      lines.push(`${edu.degree} | ${edu.institution}${edu.location ? ` | ${edu.location}` : ""}`)
      if (edu.graduationDate) lines.push(edu.graduationDate)
      if (edu.details) {
        for (const detail of edu.details) {
          lines.push(`• ${detail}`)
        }
      }
      lines.push("")
    }
  }

  if (resume.certifications && resume.certifications.length > 0) {
    lines.push("CERTIFICATIONS")
    for (const cert of resume.certifications) {
      const parts = [cert.name, cert.issuer, cert.date].filter(Boolean)
      lines.push(`• ${parts.join(" | ")}`)
    }
    lines.push("")
  }

  if (resume.projects && resume.projects.length > 0) {
    lines.push("PROJECTS")
    for (const project of resume.projects) {
      lines.push(`${project.name}${project.technologies ? ` (${project.technologies.join(", ")})` : ""}`)
      if (project.description) lines.push(project.description)
      if (project.bullets) {
        for (const bullet of project.bullets) {
          lines.push(`• ${bullet}`)
        }
      }
      lines.push("")
    }
  }

  if (resume.additionalSections) {
    for (const section of resume.additionalSections) {
      lines.push(section.title.toUpperCase())
      for (const item of section.items) {
        lines.push(`• ${item}`)
      }
      lines.push("")
    }
  }

  return lines.join("\n")
}
