import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import mammoth from "mammoth"
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, convertInchesToTwip } from "docx"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

const resumeSchema = z.object({
  name: z.string().describe("The applicant's full name"),
  subtitle: z
    .string()
    .describe(
      "A professional title/subtitle for the applicant based on the job they're applying for (e.g., 'Senior Software Engineer | Cloud Architect')",
    ),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
  }),
  summary: z.string().describe("A compelling professional summary tailored to the job description"),
  skillCategories: z
    .array(
      z.object({
        category: z
          .string()
          .describe("The category name (e.g., 'Programming Languages', 'Cloud & DevOps', 'Frameworks')"),
        skills: z.array(z.string()).describe("Individual skills in this category"),
      }),
    )
    .describe("Skills grouped by category, prioritized by relevance to the job description"),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      location: z.string().optional(),
      graduationDate: z.string(),
      details: z.array(z.string()).optional(),
    }),
  ),
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
        description: z.string(),
        technologies: z.array(z.string()).optional(),
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
  jobMetadata: z
    .object({
      jobTitle: z.string().describe("The job title being applied for, extracted from the job description"),
      companyName: z.string().describe("The company name hiring for the position, extracted from the job description"),
    })
    .describe("Metadata about the job being applied for"),
})

type ResumeData = z.infer<typeof resumeSchema>

const HEADER_GREEN = "5A9E6F"

function sanitizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u00A0/g, " ")
    .replace(/\u2022/g, "•")
    .replace(/[\uFFFD]/g, "")
    .replace(
      /[^\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u2022\u2713\u2714\u2715\u2716\u2717\u2718\u25A0\u25B6\u25CF\u2605\u2606]/g,
      "",
    )
    .trim()
}

function generateDocx(resume: ResumeData): Document {
  const sections: Paragraph[] = []

  // Header - Name
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: sanitizeText(resume.name),
          bold: true,
          size: 36,
          font: "Calibri",
          color: HEADER_GREEN,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
  )

  // Subtitle
  if (resume.subtitle) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeText(resume.subtitle),
            size: 24,
            font: "Calibri",
            color: "555555",
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
      }),
    )
  }

  // Contact Info Line
  const contactParts: string[] = []
  if (resume.contact.email) contactParts.push(resume.contact.email)
  if (resume.contact.phone) contactParts.push(resume.contact.phone)
  if (resume.contact.location) contactParts.push(resume.contact.location)
  if (resume.contact.linkedin) contactParts.push(resume.contact.linkedin)
  if (resume.contact.website) contactParts.push(resume.contact.website)

  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.map(sanitizeText).join("  |  "),
            size: 20,
            font: "Calibri",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
    )
  }

  // Helper function to add section headers
  const addSectionHeader = (title: string) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeText(title.toUpperCase()),
            bold: true,
            size: 24,
            font: "Calibri",
            color: HEADER_GREEN,
          }),
        ],
        spacing: { before: 200, after: 60 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: HEADER_GREEN,
          },
        },
      }),
    )
  }

  // Summary Section
  if (resume.summary) {
    addSectionHeader("Professional Summary")
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeText(resume.summary),
            size: 22,
            font: "Calibri",
          }),
        ],
        spacing: { after: 200 },
      }),
    )
  }

  if (resume.skillCategories && resume.skillCategories.length > 0) {
    addSectionHeader("Key Skills")

    for (const category of resume.skillCategories) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeText(category.category) + ": ",
              bold: true,
              size: 22,
              font: "Calibri",
              color: HEADER_GREEN,
            }),
            new TextRun({
              text: category.skills.map(sanitizeText).join(", "),
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 80 },
        }),
      )
    }

    sections.push(new Paragraph({ spacing: { after: 150 } }))
  }

  // Experience Section
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader("Professional Experience")

    for (const exp of resume.experience) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeText(exp.title),
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "  |  ",
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: sanitizeText(exp.company),
              italics: true,
              size: 22,
              font: "Calibri",
            }),
            ...(exp.location
              ? [
                  new TextRun({
                    text: "  |  " + sanitizeText(exp.location),
                    size: 22,
                    font: "Calibri",
                  }),
                ]
              : []),
          ],
          spacing: { before: 150, after: 50 },
        }),
      )

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${sanitizeText(exp.startDate)} - ${sanitizeText(exp.endDate)}`,
              size: 20,
              font: "Calibri",
              color: "666666",
            }),
          ],
          spacing: { after: 100 },
        }),
      )

      for (const bullet of exp.bullets) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "• " + sanitizeText(bullet),
                size: 22,
                font: "Calibri",
              }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
            spacing: { after: 50 },
          }),
        )
      }
    }
  }

  // Education Section
  if (resume.education && resume.education.length > 0) {
    addSectionHeader("Education")

    for (const edu of resume.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeText(edu.degree),
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "  |  ",
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: sanitizeText(edu.institution),
              italics: true,
              size: 22,
              font: "Calibri",
            }),
            ...(edu.location
              ? [
                  new TextRun({
                    text: "  |  " + sanitizeText(edu.location),
                    size: 22,
                    font: "Calibri",
                  }),
                ]
              : []),
          ],
          spacing: { before: 150, after: 50 },
        }),
      )

      const eduDetails: string[] = []
      if (edu.graduationDate) eduDetails.push(edu.graduationDate)
      if (edu.details && edu.details.length > 0) eduDetails.push(edu.details.join(", "))

      if (eduDetails.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: eduDetails.map(sanitizeText).join("  |  "),
                size: 20,
                font: "Calibri",
                color: "666666",
              }),
            ],
            spacing: { after: 100 },
          }),
        )
      }
    }
  }

  // Certifications Section
  if (resume.certifications && resume.certifications.length > 0) {
    addSectionHeader("Certifications")

    for (const cert of resume.certifications) {
      const certParts = [cert.name]
      if (cert.issuer) certParts.push(cert.issuer)
      if (cert.date) certParts.push(cert.date)

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "• " + certParts.map(sanitizeText).join("  |  "),
              size: 22,
              font: "Calibri",
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 50 },
        }),
      )
    }
  }

  // Projects Section
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader("Projects")

    for (const project of resume.projects) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeText(project.name),
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            ...(project.url
              ? [
                  new TextRun({
                    text: "  |  " + sanitizeText(project.url),
                    size: 20,
                    font: "Calibri",
                    color: HEADER_GREEN,
                  }),
                ]
              : []),
          ],
          spacing: { before: 100, after: 50 },
        }),
      )

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "• " + sanitizeText(project.description),
              size: 22,
              font: "Calibri",
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 100 },
        }),
      )
    }
  }

  // Additional Sections
  if (resume.additionalSections && resume.additionalSections.length > 0) {
    for (const section of resume.additionalSections) {
      addSectionHeader(section.title)

      for (const item of section.items) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "• " + sanitizeText(item),
                size: 22,
                font: "Calibri",
              }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
            spacing: { after: 50 },
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
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children: sections,
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

    const effectiveApiKey = apiKey?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!effectiveApiKey) {
      console.log("[API] Error: No API key available (neither provided nor in environment)")
      return Response.json(
        { error: "No API key available. Please provide a Google Gemini API key or configure the default key." },
        { status: 400 },
      )
    }

    console.log("[API] Using", apiKey?.trim() ? "user-provided" : "default environment", "API key")

    if (!jobDescription) {
      console.log("[API] Error: Missing job description")
      return Response.json({ error: "Job description is required." }, { status: 400 })
    }

    if (!resumeFile) {
      console.log("[API] Error: Missing resume file")
      return Response.json({ error: "Resume file is required." }, { status: 400 })
    }

    console.log("[API] Inputs validated. File:", resumeFile.name, "Size:", resumeFile.size, "bytes")

    let resumeText: string
    try {
      const arrayBuffer = await resumeFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
      console.log("[API] Extracted", resumeText.length, "characters from DOCX")
    } catch (parseError) {
      console.log("[API] Error parsing DOCX:", parseError)
      return Response.json(
        { error: "Failed to parse the DOCX file. Please ensure it's a valid .docx file." },
        { status: 400 },
      )
    }

    if (!resumeText.trim()) {
      return Response.json({ error: "The uploaded document appears to be empty." }, { status: 400 })
    }

    const prompt = `ROLE: Professional Resume Optimizer

TASK: Analyze the provided resume and job description, then return a restructured and optimized version of the resume as structured JSON data.

REQUIREMENTS:
1. Optimize all content to align exactly with the job description requirements.
2. PRESERVE THE ORIGINAL RESUME FORMAT AND STRUCTURE as much as possible - follow the same section ordering and style
3. Extract and enhance all information from the original resume
4. Use high-impact action verbs and quantified achievements
5. GROUP SKILLS BY CATEGORY (e.g., "Programming Languages", "Cloud & DevOps", "Frameworks", "Soft Skills") - prioritize categories and skills mentioned in the job description
6. Fabricate relevant UNVERIFIABLE information if it would strengthen the application based on the job description. Don't fabricate certifications from large well-known corporations like Amazon, only niche certifications or credentials from small organizations.
7. Enhance bullet points with metrics and results where possible
8. Keep job titles, company names, and dates accurate from the original
9. Write in professional, clear language without special characters or symbols that might not render properly
10. Do not modify the subtitle/professional title that appears under the name

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}

Return the optimized resume data following the exact schema structure. Preserve the original formatting style while enhancing the content.`

    console.log("[API] Calling Google Gemini API for structured output...")
    const aiStartTime = Date.now()
    const modelName = "gemini-2.5-flash"

    try {
      const google = createGoogleGenerativeAI({ apiKey: effectiveApiKey })

      const { object: resumeData } = await generateObject({
        model: google(modelName),
        schema: resumeSchema,
        prompt,
        temperature: 0.3,
      })

      const aiProcessingTime = Date.now() - aiStartTime
      console.log("[API] Structured response received in", aiProcessingTime, "ms")
      console.log("[API] Skill categories count:", resumeData.skillCategories?.length || 0)
      console.log("[API] Experience count:", resumeData.experience?.length || 0)

      const doc = generateDocx(resumeData)
      const docxBuffer = await Packer.toBuffer(doc)
      const docxBase64 = docxBuffer.toString("base64")

      const displayText = formatForDisplay(resumeData)

      const totalProcessingTime = Date.now() - requestStartTime
      console.log("[API] DOCX generated successfully in", totalProcessingTime, "ms total")

      try {
        const supabase = await createClient()

        const { error: historyError } = await supabase.from("resume_history").upsert(
          {
            job_title: resumeData.jobMetadata?.jobTitle || "Unknown Position",
            company_name: resumeData.jobMetadata?.companyName || "Unknown Company",
            job_description: jobDescription,
            generated_resume_docx: docxBase64,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "job_title,company_name",
          },
        )

        if (historyError) {
          console.error("[API] Failed to save to history:", historyError)
          // Don't fail the request if history save fails
        } else {
          console.log(
            "[API] Saved to history:",
            resumeData.jobMetadata?.jobTitle,
            "at",
            resumeData.jobMetadata?.companyName,
          )
        }
      } catch (historyErr) {
        console.error("[API] History save error:", historyErr)
        // Don't fail the request if history save fails
      }

      return Response.json({
        optimizedResume: displayText,
        docxBase64,
        jobMetadata: resumeData.jobMetadata,
        debug: {
          prompt,
          resumeTextLength: resumeText.length,
          jobDescriptionLength: jobDescription.length,
          responseLength: displayText.length,
          processingTime: aiProcessingTime,
          totalTime: totalProcessingTime,
          model: `google/${modelName}`,
          skillCategoriesCount: resumeData.skillCategories?.length || 0,
          experienceCount: resumeData.experience?.length || 0,
          extractedResumePreview: resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : ""),
        },
      })
    } catch (aiError: unknown) {
      console.log("[API] Gemini API error:", aiError)
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid")) {
        return Response.json({ error: "Invalid API key. Please check your Google Gemini API key." }, { status: 401 })
      }
      if (errorMessage.includes("quota") || errorMessage.includes("QUOTA_EXCEEDED")) {
        return Response.json({ error: "API quota exceeded. Please try again later." }, { status: 429 })
      }

      return Response.json({ error: `AI processing failed: ${errorMessage}` }, { status: 500 })
    }
  } catch (error) {
    console.log("[API] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: `An unexpected error occurred: ${errorMessage}` }, { status: 500 })
  }
}

function formatForDisplay(resume: ResumeData): string {
  const lines: string[] = []

  lines.push(resume.name)
  if (resume.subtitle) lines.push(resume.subtitle)

  const contact = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.website,
  ].filter(Boolean)
  if (contact.length) lines.push(contact.join(" | "))

  lines.push("")

  if (resume.summary) {
    lines.push("PROFESSIONAL SUMMARY")
    lines.push(resume.summary)
    lines.push("")
  }

  if (resume.skillCategories?.length) {
    lines.push("KEY SKILLS")
    for (const category of resume.skillCategories) {
      lines.push(`${category.category}: ${category.skills.join(", ")}`)
    }
    lines.push("")
  }

  if (resume.experience?.length) {
    lines.push("PROFESSIONAL EXPERIENCE")
    for (const exp of resume.experience) {
      lines.push(`${exp.title} | ${exp.company}${exp.location ? ` | ${exp.location}` : ""}`)
      lines.push(`${exp.startDate} - ${exp.endDate}`)
      for (const bullet of exp.bullets) {
        lines.push(`• ${bullet}`)
      }
      lines.push("")
    }
  }

  if (resume.education?.length) {
    lines.push("EDUCATION")
    for (const edu of resume.education) {
      lines.push(`${edu.degree} | ${edu.institution}${edu.location ? ` | ${edu.location}` : ""}`)
      const details = [edu.graduationDate, ...(edu.details || [])].filter(Boolean)
      if (details.length) lines.push(details.join(" | "))
      lines.push("")
    }
  }

  if (resume.certifications?.length) {
    lines.push("CERTIFICATIONS")
    for (const cert of resume.certifications) {
      lines.push(`• ${cert.name}${cert.issuer ? ` | ${cert.issuer}` : ""}${cert.date ? ` | ${cert.date}` : ""}`)
    }
    lines.push("")
  }

  if (resume.projects?.length) {
    lines.push("PROJECTS")
    for (const project of resume.projects) {
      lines.push(`${project.name}${project.url ? ` | ${project.url}` : ""}`)
      lines.push(`• ${project.description}`)
      lines.push("")
    }
  }

  if (resume.additionalSections?.length) {
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
