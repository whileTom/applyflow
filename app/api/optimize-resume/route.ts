import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import mammoth from "mammoth"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  convertInchesToTwip,
  ShadingType,
} from "docx"
import { z } from "zod"

export const maxDuration = 60

const ResumeSchema = z.object({
  name: z.string().describe("Full name of the candidate"),
  subtitle: z
    .string()
    .describe(
      "Professional title or tagline (e.g., 'Senior Software Engineer' or 'Marketing Manager | Brand Strategist')",
    ),
  email: z.string().describe("Email address"),
  phone: z.string().describe("Phone number"),
  location: z.string().optional().describe("City, State or location"),
  linkedin: z.string().optional().describe("LinkedIn URL or handle"),
  website: z.string().optional().describe("Personal website or portfolio URL"),
  summary: z.string().describe("Professional summary or objective, 2-4 sentences"),
  skills: z
    .array(z.string())
    .describe(
      "Array of individual skills - each skill should be ONE skill only, e.g. 'Python', 'Project Management', 'AWS'. Prioritize skills mentioned in the job description.",
    ),
  experience: z
    .array(
      z.object({
        title: z.string().describe("Job title"),
        company: z.string().describe("Company name"),
        location: z.string().optional().describe("Job location"),
        startDate: z.string().describe("Start date (e.g., 'Jan 2020' or '2020')"),
        endDate: z.string().describe("End date or 'Present'"),
        bullets: z.array(z.string()).describe("Achievement bullets with metrics and action verbs"),
      }),
    )
    .describe("Work experience entries"),
  education: z
    .array(
      z.object({
        degree: z.string().describe("Degree name"),
        school: z.string().describe("School/university name"),
        location: z.string().optional().describe("School location"),
        graduationDate: z.string().describe("Graduation date or expected date"),
        gpa: z.string().optional().describe("GPA if notable"),
        honors: z.string().optional().describe("Honors, awards, or relevant coursework"),
      }),
    )
    .describe("Education entries"),
  certifications: z
    .array(
      z.object({
        name: z.string().describe("Certification name"),
        issuer: z.string().optional().describe("Issuing organization"),
        date: z.string().optional().describe("Date obtained or expiry"),
      }),
    )
    .optional()
    .describe("Professional certifications"),
  projects: z
    .array(
      z.object({
        name: z.string().describe("Project name"),
        description: z.string().describe("Brief description with technologies used and impact"),
        url: z.string().optional().describe("Project URL if applicable"),
      }),
    )
    .optional()
    .describe("Notable projects"),
  additionalSections: z
    .array(
      z.object({
        title: z.string().describe("Section title (e.g., 'Languages', 'Volunteer Work', 'Publications')"),
        items: z.array(z.string()).describe("Items in this section"),
      }),
    )
    .optional()
    .describe("Any additional relevant sections"),
})

type ResumeData = z.infer<typeof ResumeSchema>

const PASTEL_GREENS = [
  "A8D5BA", // Mint
  "90C9A7", // Sage
  "B5E2C9", // Light mint
  "7FBC8C", // Soft fern
  "C1E7D4", // Pale seafoam
  "9FD4B0", // Eucalyptus
  "85C49B", // Moss
  "AEDCBE", // Celadon
]
const HEADER_GREEN = "5A9E6F" // Slightly darker for headers

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
          color: HEADER_GREEN, // Pine green name
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
  )

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
  if (resume.email) contactParts.push(resume.email)
  if (resume.phone) contactParts.push(resume.phone)
  if (resume.location) contactParts.push(resume.location)
  if (resume.linkedin) contactParts.push(resume.linkedin)
  if (resume.website) contactParts.push(resume.website)

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

  const getPastelGreen = (index: number): string => {
    return PASTEL_GREENS[index % PASTEL_GREENS.length]
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

  if (resume.skills && resume.skills.length > 0) {
    addSectionHeader("Key Skills")

    const calculateSkillWidth = (text: string): number => {
      // Approximate character width in twips (1 twip = 1/20 of a point)
      const avgCharWidth = 110 // Average character width in twips for Calibri 10pt
      const padding = 400 // Horizontal padding in twips
      return Math.max(text.length * avgCharWidth + padding, 600) // Minimum width
    }

    const PAGE_WIDTH = 9360
    const GAP_WIDTH = 100 // Small gap between pills

    const createSkillRows = (): TableRow[] => {
      const rows: TableRow[] = []
      let currentRowCells: TableCell[] = []
      let currentRowWidth = 0

      resume.skills.forEach((skill, index) => {
        const skillWidth = calculateSkillWidth(skill)
        const totalWidth = currentRowWidth + skillWidth + (currentRowCells.length > 0 ? GAP_WIDTH : 0)

        // Start new row if this skill would exceed page width
        if (totalWidth > PAGE_WIDTH && currentRowCells.length > 0) {
          // Add centering spacers to current row
          const remainingSpace = PAGE_WIDTH - currentRowWidth
          if (remainingSpace > 100) {
            const spacerWidth = Math.floor(remainingSpace / 2)
            currentRowCells.unshift(createSpacerCell(spacerWidth))
            currentRowCells.push(createSpacerCell(spacerWidth))
          }
          rows.push(new TableRow({ children: currentRowCells }))
          // Add small vertical gap row
          rows.push(createGapRow())
          currentRowCells = []
          currentRowWidth = 0
        }

        // Add gap cell before skill (except first in row)
        if (currentRowCells.length > 0) {
          currentRowCells.push(createSpacerCell(GAP_WIDTH))
          currentRowWidth += GAP_WIDTH
        }

        // Add skill cell with rounded appearance
        currentRowCells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sanitizeText(skill),
                    size: 20,
                    font: "Calibri",
                    color: "2D5A3D", // Dark pine green text
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: getPastelGreen(index),
              fill: getPastelGreen(index),
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 20, color: getPastelGreen(index) },
              bottom: { style: BorderStyle.SINGLE, size: 20, color: getPastelGreen(index) },
              left: { style: BorderStyle.SINGLE, size: 20, color: getPastelGreen(index) },
              right: { style: BorderStyle.SINGLE, size: 20, color: getPastelGreen(index) },
            },
            margins: {
              top: convertInchesToTwip(0.05),
              bottom: convertInchesToTwip(0.05),
              left: convertInchesToTwip(0.12),
              right: convertInchesToTwip(0.12),
            },
            width: { size: skillWidth, type: WidthType.DXA },
            verticalAlign: "center" as const,
          }),
        )
        currentRowWidth += skillWidth
      })

      // Handle last row - center it
      if (currentRowCells.length > 0) {
        const remainingSpace = PAGE_WIDTH - currentRowWidth
        if (remainingSpace > 100) {
          const spacerWidth = Math.floor(remainingSpace / 2)
          currentRowCells.unshift(createSpacerCell(spacerWidth))
          currentRowCells.push(createSpacerCell(spacerWidth))
        }
        rows.push(new TableRow({ children: currentRowCells }))
      }

      return rows
    }

    const createSpacerCell = (width: number): TableCell =>
      new TableCell({
        children: [new Paragraph({ children: [] })],
        borders: {
          top: { style: BorderStyle.NIL },
          bottom: { style: BorderStyle.NIL },
          left: { style: BorderStyle.NIL },
          right: { style: BorderStyle.NIL },
        },
        width: { size: width, type: WidthType.DXA },
      })

    const createGapRow = (): TableRow =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            borders: {
              top: { style: BorderStyle.NIL },
              bottom: { style: BorderStyle.NIL },
              left: { style: BorderStyle.NIL },
              right: { style: BorderStyle.NIL },
            },
          }),
        ],
        height: { value: convertInchesToTwip(0.08), rule: "exact" as const },
      })

    const skillsTable = new Table({
      rows: createSkillRows(),
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NIL },
        bottom: { style: BorderStyle.NIL },
        left: { style: BorderStyle.NIL },
        right: { style: BorderStyle.NIL },
        insideHorizontal: { style: BorderStyle.NIL },
        insideVertical: { style: BorderStyle.NIL },
      },
      alignment: AlignmentType.CENTER,
    })

    sections.push(new Paragraph({ spacing: { after: 80 } }))
    sections.push(skillsTable as unknown as Paragraph)
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
              text: sanitizeText(edu.school),
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
      if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`)
      if (edu.honors) eduDetails.push(edu.honors)

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

    if (!apiKey?.trim()) {
      console.log("[API] Error: Missing API key")
      return Response.json({ error: "Google Gemini API key is required. Please enter your API key." }, { status: 400 })
    }

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
1. Extract and enhance all information from the original resume
2. Optimize content to align with the job description requirements exactly
3. Use high-impact action verbs and quantified achievements
4. Prioritize skills that match the job description - list most relevant skills first
5. Each skill in the skills array MUST be exactly ONE skill (e.g., "Python", "Project Management", "AWS") - never combine multiple skills
6. Add relevant certifications, projects, or sections if they would strengthen the application
7. Enhance bullet points with metrics and results where possible
8. Keep job titles, company names, and dates accurate from the original
9. Write in professional, clear language without special characters or symbols that might not render properly
10. Create a compelling subtitle/professional title that appears under the name (e.g., "Senior Software Engineer | Cloud Architect" or "Marketing Director | Brand Strategist")

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}

Return the optimized resume data following the exact schema structure. Be thorough and create a polished, professional resume.`

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
      console.log("[API] Structured response received in", aiProcessingTime, "ms")
      console.log("[API] Skills count:", resumeData.skills?.length || 0)
      console.log("[API] Experience count:", resumeData.experience?.length || 0)

      const doc = generateDocx(resumeData)
      const docxBuffer = await Packer.toBuffer(doc)
      const docxBase64 = docxBuffer.toString("base64")

      const displayText = formatForDisplay(resumeData)

      const totalProcessingTime = Date.now() - requestStartTime
      console.log("[API] DOCX generated successfully in", totalProcessingTime, "ms total")

      return Response.json({
        optimizedResume: displayText,
        docxBase64,
        debug: {
          prompt,
          resumeTextLength: resumeText.length,
          jobDescriptionLength: jobDescription.length,
          responseLength: displayText.length,
          processingTime: aiProcessingTime,
          totalTime: totalProcessingTime,
          model: `google/${modelName}`,
          skillsCount: resumeData.skills?.length || 0,
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

  const contact = [resume.email, resume.phone, resume.location, resume.linkedin, resume.website].filter(Boolean)
  if (contact.length) lines.push(contact.join(" | "))

  lines.push("")

  if (resume.summary) {
    lines.push("PROFESSIONAL SUMMARY")
    lines.push(resume.summary)
    lines.push("")
  }

  if (resume.skills?.length) {
    lines.push("KEY SKILLS")
    lines.push(resume.skills.join(" • "))
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
      lines.push(`${edu.degree} | ${edu.school}${edu.location ? ` | ${edu.location}` : ""}`)
      const details = [edu.graduationDate, edu.gpa ? `GPA: ${edu.gpa}` : null, edu.honors].filter(Boolean)
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
