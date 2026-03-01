import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { jsPDF } from "jspdf"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import mammoth from "mammoth" // Added mammoth for DOCX extraction
import type { NextRequest } from "next/server"

export const maxDuration = 60

const resumeSchema = z.object({
  name: z.string().describe("Full name of the candidate"),
  contact: z.object({
    email: z.string().describe("Email address"),
    phone: z.string().describe("Phone number"),
    location: z.string().describe("City, State or full address"),
    linkedin: z.string().optional().nullable().describe("LinkedIn profile URL if available"),
    website: z.string().optional().nullable().describe("Personal website or portfolio URL if available"),
  }),
  professionalTitle: z
    .string()
    .optional()
    .nullable()
    .describe("Professional title/subtitle that appears under the name - keep exactly as in original"),
  summary: z.string().describe("Professional summary paragraph (2-4 sentences)"),
  keySkills: z
    .array(z.string())
    .describe(
      "Individual key technical and soft skills - one skill per array item. MOST CRITICAL TO JOB FIRST. Each item should be a single skill like 'Python', 'Project Management', 'Data Analysis'. NO categories or groupings. Maximum 25-30 individual skills.",
    ),
  experience: z
    .array(
      z.object({
        title: z.string().describe("Job title"),
        company: z.string().describe("Company name"),
        location: z.string().optional().nullable().describe("Job location"),
        startDate: z.string().describe("Start date"),
        endDate: z.string().describe("End date or 'Present'"),
        bullets: z
          .array(z.string())
          .max(5)
          .describe("Achievement-focused bullet points (max 5). Use APR format: Action + Project/Problem + Result"),
      }),
    )
    .describe("Work experience entries in reverse chronological order"),
  education: z.array(
    z.object({
      degree: z.string().describe("Degree name"),
      institution: z.string().describe("School/University name"),
      location: z.string().optional().nullable().describe("Location of institution"),
      graduationDate: z.string().describe("Graduation date or expected date"),
      details: z.string().optional().nullable().describe("GPA, honors, relevant coursework, etc."),
    }),
  ),
  certifications: z
    .array(
      z.object({
        name: z.string().describe("Certification name"),
        issuer: z.string().describe("Issuing organization"),
        date: z.string().optional().nullable().describe("Date obtained"),
      }),
    )
    .optional()
    .nullable()
    .describe("Professional certifications"),
  projects: z
    .array(
      z.object({
        name: z.string().describe("Project name"),
        description: z.string().describe("Brief project description"),
        technologies: z.array(z.string()).optional().nullable().describe("Technologies used"),
        link: z.string().optional().nullable().describe("Project URL if available"),
      }),
    )
    .optional()
    .nullable()
    .describe("Notable projects"),
  additionalSections: z
    .array(
      z.object({
        title: z.string().describe("Section title"),
        items: z.array(z.string()).describe("Section items"),
      }),
    )
    .optional()
    .nullable()
    .describe("Additional sections like Awards, Publications, Languages, etc."),
  jobMetadata: z
    .object({
      jobTitle: z.string().describe("The job title being applied for, extracted from the job description"),
      companyName: z.string().describe("The company name hiring for the position, extracted from the job description"),
    })
    .optional()
    .nullable()
    .describe("Metadata about the job being applied for"),
  interviewGuide: z
    .object({
      experienceProjects: z
        .array(
          z.object({
            company: z.string().describe("The company name"),
            companyContext: z
              .object({
                industry: z.string().describe("The primary industry the company operates in"),
                companySize: z.string().describe("Approximate company size (startup, mid-size, enterprise, etc.)"),
                mainProducts: z.array(z.string()).describe("2-3 main products or services the company provides"),
                targetMarket: z.string().describe("Who the company serves (B2B, B2C, specific industries, etc.)"),
                knownFor: z.string().describe("What the company is known for or their competitive advantage"),
                isPubliclyKnown: z
                  .boolean()
                  .describe("Whether this is based on public info (true) or fabricated (false)"),
              })
              .describe(
                "Detailed context about what the company does - research if public, fabricate realistically if not",
              ),
            title: z.string().describe("The job title"),
            projects: z
              .array(
                z.object({
                  projectName: z.string().describe("A specific, memorable project name"),
                  productOrService: z
                    .string()
                    .describe("The specific product, service, or system this project was part of"),
                  description: z
                    .string()
                    .describe(
                      "2-3 sentence description of the project scope and your role, referencing the actual product/service",
                    ),
                  businessContext: z
                    .string()
                    .describe("How this project fit into the company's business goals and served customers"),
                  challenges: z.array(z.string()).describe("2-3 key challenges you faced"),
                  solutions: z.array(z.string()).describe("2-3 solutions or approaches you implemented"),
                  outcomes: z.array(z.string()).describe("2-3 measurable outcomes or results"),
                  relatedBullets: z
                    .array(z.number())
                    .describe("Indices (0-4) of the resume bullets this project relates to"),
                  talkingPoints: z.array(z.string()).describe("3-5 specific talking points for interview discussion"),
                }),
              )
              .describe("2-4 specific projects from this role that relate to resume bullets"),
          }),
        )
        .describe("Projects organized by job experience"),
      behavioralQuestions: z
        .array(
          z.object({
            question: z.string().describe("A common behavioral interview question"),
            suggestedProject: z.string().describe("Which project to reference when answering"),
            keyPoints: z.array(z.string()).describe("Key points to hit in your answer using STAR method"),
          }),
        )
        .describe("5-8 behavioral questions with suggested answers based on your projects"),
      technicalTopics: z
        .array(
          z.object({
            topic: z.string().describe("A technical topic likely to be discussed"),
            projectContext: z.string().describe("How this relates to your experience"),
            depthPoints: z.array(z.string()).describe("Points to demonstrate deep knowledge"),
          }),
        )
        .describe("4-6 technical topics to prepare for based on the job description"),
    })
    .optional()
    .nullable()
    .describe("Interview preparation guide linking resume bullets to specific projects and talking points"),
})

type ResumeData = z.infer<typeof resumeSchema>

// Style options interface with new options
interface StyleOptions {
  fontFamily: "helvetica" | "times" | "courier" | "georgia" | "palatino" | "arial" | "roboto"
  fontScale: "xs" | "s" | "m" | "l" | "xl"
  colorScheme:
    | "classic-green"
    | "corporate-blue"
    | "elegant-gray"
    | "modern-teal"
    | "professional-navy"
    | "minimalist-black"
    | "warm-burgundy"
    | "creative-purple"
    | "custom" // Added custom color option
  customColor?: string
  nameHeaderAlignment: "center" | "left" | "right"
  headerAlignment: "center" | "left" | "right"
  margins: "compact" | "standard" | "spacious"
  sectionSpacing: "tight" | "normal" | "relaxed"
  skillsStyle: "pills" | "list" | "inline" | "columns"
  bulletStyle: "dot" | "dash" | "arrow" | "square" | "circle"
  dividerStyle: "line" | "double-line" | "dotted" | "none" | "thick"
  nameSize: "small" | "medium" | "large"
  nameStyle: "uppercase" | "titlecase" | "lowercase"
  datePosition: "right" | "below" | "inline"
  includePhoto: boolean
  photoPosition: "left" | "center" | "right"
}

const DEFAULT_STYLE: StyleOptions = {
  fontFamily: "helvetica",
  fontScale: "m",
  colorScheme: "classic-green",
  nameHeaderAlignment: "center",
  headerAlignment: "left",
  margins: "compact", // changed default from "standard" to "compact"
  sectionSpacing: "normal",
  skillsStyle: "pills",
  bulletStyle: "dot",
  dividerStyle: "line",
  nameSize: "medium",
  nameStyle: "titlecase",
  datePosition: "below",
  includePhoto: false,
  photoPosition: "left",
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
    : [0, 0, 0]
}

// Color scheme mappings
const COLOR_SCHEMES: Record<
  Exclude<StyleOptions["colorScheme"], "custom">,
  { primary: [number, number, number]; secondary: [number, number, number]; accent: [number, number, number] }
> = {
  "classic-green": { primary: [45, 106, 79], secondary: [40, 80, 60], accent: [180, 200, 190] },
  "corporate-blue": { primary: [30, 64, 175], secondary: [30, 58, 138], accent: [147, 197, 253] },
  "elegant-gray": { primary: [55, 65, 81], secondary: [75, 85, 99], accent: [156, 163, 175] },
  "modern-teal": { primary: [15, 118, 110], secondary: [17, 94, 89], accent: [153, 246, 228] },
  "professional-navy": { primary: [30, 58, 95], secondary: [30, 41, 59], accent: [148, 163, 184] },
  "minimalist-black": { primary: [24, 24, 27], secondary: [39, 39, 42], accent: [161, 161, 170] },
  "warm-burgundy": { primary: [127, 29, 29], secondary: [153, 27, 27], accent: [252, 165, 165] },
  "creative-purple": { primary: [88, 28, 135], secondary: [107, 33, 168], accent: [216, 180, 254] },
}

function getColors(options: StyleOptions) {
  if (options.colorScheme === "custom" && options.customColor) {
    const primary = hexToRgb(options.customColor)
    // Generate secondary (slightly darker) and accent (lighter) from primary
    const secondary: [number, number, number] = [
      Math.max(0, primary[0] - 20),
      Math.max(0, primary[1] - 20),
      Math.max(0, primary[2] - 20),
    ]
    const accent: [number, number, number] = [
      Math.min(255, primary[0] + 100),
      Math.min(255, primary[1] + 100),
      Math.min(255, primary[2] + 100),
    ]
    return { primary, secondary, accent }
  }
  return COLOR_SCHEMES[options.colorScheme as Exclude<StyleOptions["colorScheme"], "custom">]
}

// Bullet character mappings
const BULLET_CHARS: Record<StyleOptions["bulletStyle"], string> = {
  dot: "•",
  dash: "–",
  arrow: "→",
  square: "■",
  circle: "○",
}

// Font mappings (jsPDF built-in fonts)
const FONT_MAPPINGS: Record<StyleOptions["fontFamily"], string> = {
  helvetica: "helvetica",
  arial: "helvetica", // Arial maps to helvetica in jsPDF
  roboto: "helvetica", // Roboto maps to helvetica in jsPDF (closest match)
  times: "times",
  courier: "courier",
  georgia: "times", // Fallback to times for serif
  palatino: "times", // Fallback to times for serif
}

const FONT_SCALE_MULTIPLIERS: Record<StyleOptions["fontScale"], number> = {
  xs: 0.85,
  s: 0.92,
  m: 1.0,
  l: 1.08,
  xl: 1.15,
}

function sanitizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u00A0/g, " ")
    .replace(/\u2022/g, "•")
    .replace(/[\xFD\xFE]/g, "") // Remove special characters that look like bullets but aren't
    .replace(/[\uFFFD]/g, "")
    .replace(
      /[^\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u2022\u2713\u2714\u2715\u2716\u2717\u2718\u25A0\u25B6\u25CF\u2605\u2606]/g,
      "",
    )
    .trim()
}

function generateDocx(resume: ResumeData, styleOptions: StyleOptions): string {
  // This function needs to be implemented to generate DOCX.
  // For now, it's a placeholder.
  // You would typically use a library like 'docx' for this.
  console.warn("DOCX generation is not yet implemented.")
  return "" // Return empty string or handle appropriately
}

// Fallback model order for when a model is overloaded
const MODEL_FALLBACK_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-3-flash",
  "gemini-2.5-pro",
  "gemini-3-pro",
]

async function callGeminiAPI(prompt: string, apiKey: string, model: string, retryCount = 0): Promise<ResumeData> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}

IMPORTANT: You must respond with ONLY a valid JSON object matching this exact structure (no markdown, no code blocks, just raw JSON):
{
  "name": "string or null",
  "contact": {
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "website": "string or null"
  },
  "professionalTitle": "string or null",
  "summary": "string or null",
  "keySkills": ["string"] or null,
  "experience": [
    {
      "title": "string or null",
      "company": "string or null",
      "location": "string or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "bullets": ["string"] or null,
    }
  ],
  "education": [
    {
      "degree": "string or null",
      "institution": "string or null",
      "location": "string or null",
      "graduationDate": "string or null",
      "details": "string or null"
    }
  ],
  "certifications": [
    {
      "name": "string or null",
      "issuer": "string or null",
      "date": "string or null"
    }
  ] or null,
  "projects": [
    {
      "name": "string or null",
      "description": "string or null",
      "technologies": ["string"] or null,
      "link": "string or null"
    }
  ] or null,
  "additionalSections": [
    {
      "title": "string or null",
      "items": ["string"] or null,
    }
  ] or null,
  "jobMetadata": {
    "jobTitle": "string or null",
    "companyName": "string or null"
  } or null,
  "interviewGuide": {
    "experienceProjects": [
      {
        "company": "string or null",
        "companyContext": {
          "industry": "string or null",
          "companySize": "string or null",
          "mainProducts": ["string"] or null,
          "targetMarket": "string or null",
          "knownFor": "string or null",
          "isPubliclyKnown": "boolean or null"
        },
        "title": "string or null",
        "projects": [
          {
            "projectName": "string or null",
            "productOrService": "string or null",
            "description": "string or null",
            "businessContext": "string or null",
            "challenges": ["string"] or null,
            "solutions": ["string"] or null,
            "outcomes": ["string"] or null,
            "relatedBullets": ["number"] or null,
            "talkingPoints": ["string"] or null,
          }
        ]
      }
    ] or null,
    "behavioralQuestions": [
      {
        "question": "string or null",
        "suggestedProject": "string or null",
        "keyPoints": ["string"] or null,
      }
    ] or null,
    "technicalTopics": [
      {
        "topic": "string or null",
        "projectContext": "string or null",
        "depthPoints": ["string"] or null,
      }
    ] or null
  } or null
}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    let errorData: any = {}
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { rawError: errorText }
    }
    console.log("[API] Gemini API error response status:", response.status)
    console.log(
      "[API] Gemini API error response headers:",
      JSON.stringify(Object.fromEntries(response.headers.entries())),
    )
    console.log("[API] Gemini API error response body (full):", errorText)
    const errorMessage =
      errorData.error?.message || errorData.rawError || `API request failed with status ${response.status}`

    // Handle 503 (overloaded) by silently switching to fallback model
    if (response.status === 503 && retryCount < MODEL_FALLBACK_ORDER.length - 1) {
      const currentIndex = MODEL_FALLBACK_ORDER.indexOf(model)
      const nextIndex = currentIndex >= 0 ? currentIndex + 1 : retryCount + 1
      if (nextIndex < MODEL_FALLBACK_ORDER.length) {
        const fallbackModel = MODEL_FALLBACK_ORDER[nextIndex]
        console.log(`[API] Model ${model} overloaded (503), silently switching to ${fallbackModel}`)
        return callGeminiAPI(prompt, apiKey, fallbackModel, retryCount + 1)
      }
    }

    throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`)
  }

  const data = await response.json()

  console.log("[API] Gemini response candidates:", data.candidates?.length || 0)
  console.log("[API] Gemini finish reason:", data.candidates?.[0]?.finishReason)

  if (data.candidates?.[0]?.finishReason === "SAFETY") {
    console.log("[API] Response blocked by safety filters")
    throw new Error("Response was blocked by content safety filters. Try simplifying the job description.")
  }

  if (data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
    console.log("[API] Response was truncated due to max tokens")
  }

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.log("[API] Unexpected Gemini response structure:", JSON.stringify(data).substring(0, 1000))
    const blockReason = data.promptFeedback?.blockReason
    if (blockReason) {
      throw new Error(`Request blocked: ${blockReason}. Try simplifying the input.`)
    }
    throw new Error("Invalid response structure from Gemini API - no text content returned")
  }

  let jsonText = data.candidates[0].content.parts[0].text.trim()

  console.log("[API] Raw response length:", jsonText.length)
  console.log("[API] Raw response first 200 chars:", jsonText.substring(0, 200))
  console.log("[API] Raw response last 200 chars:", jsonText.substring(Math.max(0, jsonText.length - 200)))

  // Remove markdown code blocks if present
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7)
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3)
  }
  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3)
  }
  jsonText = jsonText.trim()

  // Extract JSON object
  const jsonStartIndex = jsonText.indexOf("{")
  const jsonEndIndex = jsonText.lastIndexOf("}")
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonStartIndex < jsonEndIndex) {
    jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex + 1)
  }

  // Remove trailing commas before } or ]
  jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1")
  // Remove control characters except newlines and tabs within strings
  jsonText = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  // Fix unescaped newlines in strings (but be careful not to break valid JSON)

  console.log("[API] Cleaned JSON length:", jsonText.length)

  try {
    const parsed = JSON.parse(jsonText)
    console.log("[API] JSON parsed successfully, validating against schema...")
    try {
      const validated = resumeSchema.parse(parsed)
      console.log("[API] JSON validated successfully against schema")
      return validated
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.log("[API] Zod validation error (full):", JSON.stringify(validationError.errors, null, 2))

        // Try to fix array length issues by truncating
        const fixedData = { ...parsed }

        // Truncate experience bullets to max 5
        if (fixedData.experience && Array.isArray(fixedData.experience)) {
          fixedData.experience = fixedData.experience.map((exp: any) => ({
            ...exp,
            bullets: Array.isArray(exp.bullets) ? exp.bullets.slice(0, 5) : exp.bullets,
          }))
        }

        // Truncate projects to max 3
        if (fixedData.projects && Array.isArray(fixedData.projects)) {
          fixedData.projects = fixedData.projects.slice(0, 3)
        }

        // Truncate certifications to max 5
        if (fixedData.certifications && Array.isArray(fixedData.certifications)) {
          fixedData.certifications = fixedData.certifications.slice(0, 5)
        }

        // Add defaults for missing optional fields
        const partialData = {
          ...fixedData,
          jobMetadata: fixedData.jobMetadata || { jobTitle: "Position", companyName: "Company" },
          interviewGuide: fixedData.interviewGuide || null,
          certifications: fixedData.certifications || [],
          projects: fixedData.projects || [],
          additionalSections: fixedData.additionalSections || [],
        }

        try {
          const revalidated = resumeSchema.parse(partialData)
          console.log("[API] Validation successful after fixing array lengths")
          return revalidated
        } catch (revalidationError) {
          console.log("[API] Validation still failed after fixes:", revalidationError)
          if (revalidationError instanceof z.ZodError) {
            const errorDetails = revalidationError.errors
              .map((e: any) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")
            throw new Error(`Schema validation failed: ${errorDetails}`)
          }
          throw new Error("Schema validation failed: Unknown validation error")
        }
      }
      throw validationError
    }
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      console.log("[API] JSON syntax error:", parseError.message)
      console.log("[API] JSON preview (first 500):", jsonText.substring(0, 500))
      console.log("[API] JSON preview (last 500):", jsonText.substring(Math.max(0, jsonText.length - 500)))

      const match = parseError.message.match(/position (\d+)/)
      if (match) {
        const pos = Number.parseInt(match[1])
        console.log("[API] Error around position", pos, ":", jsonText.substring(Math.max(0, pos - 100), pos + 100))
      }

      // Attempt repair
      try {
        const repairedJson = jsonText
          // Remove any BOM or zero-width characters
          .replace(/^\uFEFF/, "")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          // Replace smart quotes with regular quotes
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          // Remove any remaining control characters
          .replace(/[\x00-\x1F\x7F]/g, (match) => {
            // Keep newlines and tabs as spaces
            if (match === "\n" || match === "\r" || match === "\t") return " "
            return ""
          })
          // Fix common escape sequence issues
          .replace(/\\'/g, "'")
          // Remove trailing commas more aggressively
          .replace(/,\s*,/g, ",")
          .replace(/,(\s*[}\]])/g, "$1")
          // Fix missing commas between array elements (common issue)
          .replace(/"\s*\n\s*"/g, '", "')
          .replace(/}\s*\n\s*{/g, "}, {")

        const reparsed = JSON.parse(repairedJson)
        const partialData = {
          ...reparsed,
          jobMetadata: reparsed.jobMetadata || { jobTitle: "Position", companyName: "Company" },
          interviewGuide: reparsed.interviewGuide || null,
        }
        const revalidated = resumeSchema.parse(partialData)
        console.log("[API] JSON repair and validation successful")
        return revalidated
      } catch (repairError) {
        console.log("[API] JSON repair also failed:", repairError)
        throw new Error(`Failed to parse AI response as valid JSON. Syntax error: ${parseError.message}`)
      }
    }

    // Re-throw non-syntax errors (like validation errors)
    throw parseError
  }
}

// Added helper function to fetch and convert avatar URL to base64 data URI
async function fetchAvatarAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch avatar: ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    // Determine image format from URL or content-type
    const contentType = response.headers.get("content-type") || "image/jpeg"
    const format = contentType.split("/")[1] || "jpeg"

    // Use Buffer.from for Node.js environments
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    return `data:${contentType};base64,${base64}`
  } catch (err) {
    console.error("Error fetching avatar:", err)
    return null
  }
}

// Updated generatePdf to include style options
function generatePdf(
  resume: ResumeData,
  styleOptions: StyleOptions = DEFAULT_STYLE,
  avatarUrl?: string | null, // Changed parameter name to avatarUrl for clarity, but it expects base64 data URI now
): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const marginMap = { compact: 40, standard: 54, spacious: 72 }
  const margin = marginMap[styleOptions.margins]
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const fontScale = FONT_SCALE_MULTIPLIERS[styleOptions.fontScale] || 1.0

  const spacingMap = { tight: 12, normal: 16, relaxed: 22 }
  const SECTION_SPACING = Math.round(spacingMap[styleOptions.sectionSpacing] * fontScale)
  const LINE_HEIGHT_BODY = Math.round(
    (styleOptions.sectionSpacing === "tight" ? 12 : styleOptions.sectionSpacing === "relaxed" ? 16 : 14) * fontScale,
  )
  const LINE_HEIGHT_SMALL = Math.round(
    (styleOptions.sectionSpacing === "tight" ? 10 : styleOptions.sectionSpacing === "relaxed" ? 14 : 12) * fontScale,
  )

  // Use getColors helper to retrieve colors
  const colors = getColors(styleOptions)
  const HEADER_COLOR = colors.primary
  const TEXT_COLOR: [number, number, number] = [30, 30, 30]
  const MUTED_COLOR: [number, number, number] = [100, 100, 100]

  const fontFamily = FONT_MAPPINGS[styleOptions.fontFamily]

  const bulletChar = BULLET_CHARS[styleOptions.bulletStyle]

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  const addSectionHeader = (title: string) => {
    checkPageBreak(30)
    y += SECTION_SPACING
    doc.setFont(fontFamily, "bold")
    doc.setFontSize(Math.round(12 * fontScale)) // Apply font scale
    doc.setTextColor(...HEADER_COLOR)

    const headerText = styleOptions.nameStyle === "uppercase" ? title.toUpperCase() : title

    // Position based on section header alignment
    if (styleOptions.headerAlignment === "center") {
      const textWidth = doc.getTextWidth(headerText)
      doc.text(headerText, (pageWidth - textWidth) / 2, y)
    } else if (styleOptions.headerAlignment === "right") {
      const textWidth = doc.getTextWidth(headerText)
      doc.text(headerText, pageWidth - margin - textWidth, y)
    } else {
      doc.text(headerText, margin, y)
    }

    y += 4

    if (styleOptions.dividerStyle !== "none") {
      doc.setDrawColor(...colors.accent)

      if (styleOptions.dividerStyle === "line") {
        doc.setLineWidth(0.5)
        doc.line(margin, y, pageWidth - margin, y)
      } else if (styleOptions.dividerStyle === "double-line") {
        doc.setLineWidth(0.5)
        doc.line(margin, y, pageWidth - margin, y)
        doc.line(margin, y + 2, pageWidth - margin, y + 2)
        y += 2
      } else if (styleOptions.dividerStyle === "dotted") {
        doc.setLineWidth(0.5)
        doc.setLineDashPattern([2, 2], 0)
        doc.line(margin, y, pageWidth - margin, y)
        doc.setLineDashPattern([], 0)
      } else if (styleOptions.dividerStyle === "thick") {
        doc.setLineWidth(2)
        doc.line(margin, y, pageWidth - margin, y)
      }
    }
    y += 12
  }

  const nameSizeMap = { small: 14, medium: 18, large: 24 }
  const nameSize = Math.round(nameSizeMap[styleOptions.nameSize] * fontScale)

  let displayName = sanitizeText(resume.name)
  if (styleOptions.nameStyle === "uppercase") {
    displayName = displayName.toUpperCase()
  } else if (styleOptions.nameStyle === "lowercase") {
    displayName = displayName.toLowerCase()
  }

  const photoSize = 60 // Photo size in points
  const photoMargin = 12 // Space between photo and text
  let photoX = margin
  let headerStartX = margin
  let headerEndX = pageWidth - margin
  let headerContentWidth = contentWidth

  // Adjust header layout based on photo position
  if (
    styleOptions.includePhoto &&
    avatarUrl &&
    (styleOptions.photoPosition === "left" || styleOptions.photoPosition === "right")
  ) {
    headerStartX = margin + photoSize + photoMargin
    headerContentWidth = contentWidth - photoSize - photoMargin
    if (styleOptions.photoPosition === "right") {
      photoX = pageWidth - margin - photoSize
      headerEndX = pageWidth - margin - photoSize - photoMargin
    }
  }

  // Handle center photo position separately
  if (styleOptions.includePhoto && avatarUrl && styleOptions.photoPosition === "center") {
    photoX = (pageWidth - photoSize) / 2
    try {
      // For center position, draw photo first, then move y down
      doc.addImage(avatarUrl, "JPEG", photoX, y, photoSize, photoSize)
      y += photoSize + photoMargin
    } catch (err) {
      console.error("Failed to add photo to PDF:", err)
    }
  }

  // Store starting Y for left/right photo positioning
  const headerStartY = y

  doc.setFont(fontFamily, "bold")
  doc.setFontSize(nameSize)
  doc.setTextColor(...HEADER_COLOR)

  if (styleOptions.nameHeaderAlignment === "center") {
    const nameWidth = doc.getTextWidth(displayName)
    if (styleOptions.includePhoto && avatarUrl && styleOptions.photoPosition !== "center") {
      // Center within available space
      const centerX = headerStartX + (headerContentWidth - nameWidth) / 2
      doc.text(displayName, centerX, y)
    } else {
      doc.text(displayName, (pageWidth - nameWidth) / 2, y)
    }
  } else if (styleOptions.nameHeaderAlignment === "right") {
    const nameWidth = doc.getTextWidth(displayName)
    doc.text(displayName, headerEndX - nameWidth, y)
  } else {
    doc.text(displayName, headerStartX, y)
  }
  y += nameSize + 4

  // Professional title - use nameHeaderAlignment
  if (resume.professionalTitle) {
    doc.setFont(fontFamily, "normal")
    doc.setFontSize(Math.round(11 * fontScale)) // Apply font scale
    doc.setTextColor(80, 80, 80)
    const titleText = sanitizeText(resume.professionalTitle)

    if (styleOptions.nameHeaderAlignment === "center") {
      const subtitleWidth = doc.getTextWidth(titleText)
      if (styleOptions.includePhoto && avatarUrl && styleOptions.photoPosition !== "center") {
        const centerX = headerStartX + (headerContentWidth - subtitleWidth) / 2
        doc.text(titleText, centerX, y)
      } else {
        doc.text(titleText, (pageWidth - subtitleWidth) / 2, y)
      }
    } else if (styleOptions.nameHeaderAlignment === "right") {
      const subtitleWidth = doc.getTextWidth(titleText)
      doc.text(titleText, headerEndX - subtitleWidth, y)
    } else {
      doc.text(titleText, headerStartX, y)
    }
    y += 18
  }

  // Contact info - use nameHeaderAlignment
  if (resume.contact) {
    doc.setFont(fontFamily, "normal")
    doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
    doc.setTextColor(...MUTED_COLOR)

    const contactParts = []
    if (resume.contact.email) contactParts.push(sanitizeText(resume.contact.email))
    if (resume.contact.phone) contactParts.push(sanitizeText(resume.contact.phone))
    if (resume.contact.location) contactParts.push(sanitizeText(resume.contact.location))
    if (resume.contact.linkedin) contactParts.push(sanitizeText(resume.contact.linkedin))
    if (resume.contact.website) contactParts.push(sanitizeText(resume.contact.website))

    const contactText = contactParts.join("   •   ")

    if (styleOptions.nameHeaderAlignment === "center") {
      const contactWidth = doc.getTextWidth(contactText)
      if (styleOptions.includePhoto && avatarUrl && styleOptions.photoPosition !== "center") {
        const centerX = headerStartX + (headerContentWidth - contactWidth) / 2
        doc.text(contactText, centerX, y)
      } else {
        doc.text(contactText, (pageWidth - contactWidth) / 2, y)
      }
    } else if (styleOptions.nameHeaderAlignment === "right") {
      const contactWidth = doc.getTextWidth(contactText)
      doc.text(contactText, headerEndX - contactWidth, y)
    } else {
      doc.text(contactText, headerStartX, y)
    }
    y += 20
  }

  // Add photo if included and not centered (left/right alignment handled here)
  if (styleOptions.includePhoto && avatarUrl && styleOptions.photoPosition !== "center") {
    try {
      doc.addImage(avatarUrl, "JPEG", photoX, headerStartY, photoSize, photoSize)
      // Ensure y is at least below the photo
      if (y < headerStartY + photoSize + photoMargin) {
        y = headerStartY + photoSize + photoMargin
      }
    } catch (err) {
      console.error("Failed to add photo to PDF:", err)
    }
  }

  // Summary
  if (resume.summary) {
    addSectionHeader("Professional Summary")
    doc.setFont(fontFamily, "normal")
    doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
    doc.setTextColor(...TEXT_COLOR)
    const summaryLines = doc.splitTextToSize(sanitizeText(resume.summary), contentWidth)
    for (const line of summaryLines) {
      checkPageBreak(LINE_HEIGHT_BODY)
      doc.text(line, margin, y)
      y += LINE_HEIGHT_BODY
    }
  }

  // SKILLS SECTION
  if (resume.keySkills && resume.keySkills.length > 0) {
    const allSkills: string[] = resume.keySkills.map(sanitizeText)

    if (styleOptions.skillsStyle === "pills") {
      // Original pills style
      y += 5
      const skillsToShow: string[] = []
      let currentX = margin
      let rowY = y
      let tempX = margin
      let rowCount = 1
      const pillPaddingX = 8
      const pillPaddingY = 4
      const pillHeight = Math.round(18 * fontScale) // Apply font scale
      const pillSpacing = 6
      const rowSpacing = Math.round(8 * fontScale) // Apply font scale
      const maxRows = 5

      for (const skill of allSkills) {
        if (skillsToShow.length >= 35) break
        doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
        const textWidth = doc.getTextWidth(skill)
        const pillWidth = textWidth + pillPaddingX * 2

        if (tempX + pillWidth > pageWidth - margin) {
          tempX = margin
          rowCount++
          if (rowCount > maxRows) break
        }
        skillsToShow.push(skill)
        tempX += pillWidth + pillSpacing
      }

      // Reset for actual drawing
      tempX = margin
      rowCount = 1
      for (const skill of skillsToShow) {
        doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
        const textWidth = doc.getTextWidth(skill)
        const pillWidth = textWidth + pillPaddingX * 2

        if (tempX + pillWidth > pageWidth - margin) {
          tempX = margin
          rowCount++
        }
        tempX += pillWidth + pillSpacing
      }

      const cloudHeight = rowCount * (pillHeight + rowSpacing)
      checkPageBreak(cloudHeight + 20)

      for (const skill of skillsToShow) {
        doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
        const textWidth = doc.getTextWidth(skill)
        const pillWidth = textWidth + pillPaddingX * 2

        if (currentX + pillWidth > pageWidth - margin) {
          currentX = margin
          rowY += pillHeight + rowSpacing
        }

        // Use color scheme for pills
        doc.setFillColor(colors.accent[0] + 50, colors.accent[1] + 50, colors.accent[2] + 50)
        doc.setDrawColor(...colors.accent)
        doc.roundedRect(currentX, rowY - pillHeight + pillPaddingY, pillWidth, pillHeight, 6, 6, "FD")

        doc.setFont(fontFamily, "normal")
        doc.setTextColor(...colors.secondary)
        doc.text(skill, currentX + pillPaddingX, rowY - pillHeight + pillPaddingY + pillHeight / 2 + 3)

        currentX += pillWidth + pillSpacing
      }

      y = rowY + 20
    } else if (styleOptions.skillsStyle === "list") {
      // Bullet list style
      doc.setFont(fontFamily, "normal")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)

      for (const skill of allSkills.slice(0, 20)) {
        checkPageBreak(LINE_HEIGHT_BODY)
        doc.text(`${bulletChar}  ${skill}`, margin, y)
        y += LINE_HEIGHT_BODY
      }
      y += 5
    } else if (styleOptions.skillsStyle === "inline") {
      // Inline comma-separated
      doc.setFont(fontFamily, "normal")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)

      const skillsText = allSkills.slice(0, 25).join("  •  ")
      const skillLines = doc.splitTextToSize(skillsText, contentWidth)
      for (const line of skillLines) {
        checkPageBreak(LINE_HEIGHT_BODY)
        doc.text(line, margin, y)
        y += LINE_HEIGHT_BODY
      }
      y += 5
    } else if (styleOptions.skillsStyle === "columns") {
      // Two-column style
      doc.setFont(fontFamily, "normal")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)

      const colWidth = (contentWidth - 20) / 2
      const skills = allSkills.slice(0, 20)
      const midPoint = Math.ceil(skills.length / 2)
      const leftCol = skills.slice(0, midPoint)
      const rightCol = skills.slice(midPoint)

      const startY = y
      for (const skill of leftCol) {
        checkPageBreak(LINE_HEIGHT_BODY)
        doc.text(`${bulletChar}  ${skill}`, margin, y)
        y += LINE_HEIGHT_BODY
      }

      let rightY = startY
      for (const skill of rightCol) {
        doc.text(`${bulletChar}  ${skill}`, margin + colWidth + 20, rightY)
        rightY += LINE_HEIGHT_BODY
      }

      y = Math.max(y, rightY) + 5
    }

    doc.setTextColor(0, 0, 0)
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader("Professional Experience")
    for (const exp of resume.experience) {
      checkPageBreak(50)

      doc.setFont(fontFamily, "bold")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)
      doc.text(sanitizeText(exp.title), margin, y)

      const titleWidth = doc.getTextWidth(sanitizeText(exp.title))
      doc.setFont(fontFamily, "normal")
      doc.setTextColor(60, 60, 60)
      const companyText = sanitizeText(exp.company) + (exp.location ? `, ${sanitizeText(exp.location)}` : "")

      if (styleOptions.datePosition === "right") {
        // Title on left, date on right
        const dateText = `${sanitizeText(exp.startDate)} – ${sanitizeText(exp.endDate)}`
        doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
        doc.setTextColor(...MUTED_COLOR)
        const dateWidth = doc.getTextWidth(dateText)
        doc.text(dateText, pageWidth - margin - dateWidth, y)

        y += LINE_HEIGHT_BODY
        doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
        doc.setTextColor(60, 60, 60)
        doc.text(companyText, margin, y)
        y += LINE_HEIGHT_BODY + 2
      } else if (styleOptions.datePosition === "inline") {
        // All on one line if it fits
        const fullText = ` | ${companyText} | ${exp.startDate} – ${exp.endDate}`
        if (titleWidth + doc.getTextWidth(fullText) < contentWidth) {
          doc.text(fullText, margin + titleWidth, y)
          y += LINE_HEIGHT_BODY + 2
        } else {
          y += LINE_HEIGHT_BODY
          doc.text(companyText, margin, y)
          y += LINE_HEIGHT_BODY
          doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
          doc.setTextColor(...MUTED_COLOR)
          doc.text(`${sanitizeText(exp.startDate)} – ${sanitizeText(exp.endDate)}`, margin, y)
          y += LINE_HEIGHT_SMALL + 2
        }
      } else {
        // Default: below
        if (titleWidth + doc.getTextWidth("  |  " + companyText) < contentWidth) {
          doc.text("  |  " + companyText, margin + titleWidth, y)
        } else {
          y += LINE_HEIGHT_BODY
          doc.text(companyText, margin, y)
        }
        y += LINE_HEIGHT_BODY

        doc.setFont(fontFamily, "normal")
        doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
        doc.setTextColor(...MUTED_COLOR)
        doc.text(`${sanitizeText(exp.startDate)} – ${sanitizeText(exp.endDate)}`, margin, y)
        y += LINE_HEIGHT_SMALL + 2
      }

      doc.setFont(fontFamily, "normal")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)
      if (exp.bullets && Array.isArray(exp.bullets)) {
        for (const bullet of exp.bullets) {
          const bulletLines = doc.splitTextToSize(`${bulletChar}  ${sanitizeText(bullet)}`, contentWidth - 12)
          for (let i = 0; i < bulletLines.length; i++) {
            checkPageBreak(LINE_HEIGHT_BODY)
            doc.text(bulletLines[i], margin + (i === 0 ? 0 : 12), y)
            y += LINE_HEIGHT_BODY
          }
        }
      }
      y += 10
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    const educationHeight = calculateEducationHeight(resume.education)
    if (y + educationHeight > pageHeight - margin && y > margin + 50) {
      doc.addPage()
      y = margin
    }

    addSectionHeader("Education")
    for (const edu of resume.education) {
      doc.setFont(fontFamily, "bold")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)
      doc.text(sanitizeText(edu.degree), margin, y)
      y += LINE_HEIGHT_BODY

      doc.setFont(fontFamily, "normal")
      doc.setTextColor(60, 60, 60)
      const instText = sanitizeText(edu.institution) + (edu.location ? `, ${sanitizeText(edu.location)}` : "")
      doc.text(instText, margin, y)
      y += LINE_HEIGHT_BODY

      const details: string[] = []
      if (edu.graduationDate) details.push(edu.graduationDate)
      if (edu.details) details.push(edu.details)

      if (details.length > 0) {
        doc.setFontSize(Math.round(9 * fontScale)) // Apply font scale
        doc.setTextColor(...MUTED_COLOR)
        doc.text(details.map(sanitizeText).join("  |  "), margin, y)
        y += LINE_HEIGHT_SMALL
      }
      y += 8
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    const certificationsHeight = calculateCertificationsHeight(resume.certifications)
    if (y + certificationsHeight > pageHeight - margin && y > margin + 50) {
      doc.addPage()
      y = margin
    }

    addSectionHeader("Certifications")
    doc.setFont(fontFamily, "normal")
    doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
    doc.setTextColor(...TEXT_COLOR)
    for (const cert of resume.certifications) {
      const certText =
        sanitizeText(cert.name) +
        (cert.issuer ? ` – ${sanitizeText(cert.issuer)}` : "") +
        (cert.date ? ` (${sanitizeText(cert.date)})` : "")
      doc.text(`${bulletChar}  ${certText}`, margin, y)
      y += LINE_HEIGHT_BODY
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader("Projects")
    for (const project of resume.projects) {
      checkPageBreak(35)

      doc.setFont(fontFamily, "bold")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)
      doc.text(sanitizeText(project.name), margin, y)

      if (project.link) {
        const nameWidth = doc.getTextWidth(sanitizeText(project.name) + "  ")
        doc.setFont(fontFamily, "normal")
        doc.setTextColor(...HEADER_COLOR)
        doc.text(sanitizeText(project.link), margin + nameWidth, y)
      }
      y += LINE_HEIGHT_BODY

      doc.setFont(fontFamily, "normal")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)
      const descLines = doc.splitTextToSize(sanitizeText(project.description), contentWidth)
      for (const line of descLines) {
        checkPageBreak(LINE_HEIGHT_BODY)
        doc.text(line, margin, y)
        y += LINE_HEIGHT_BODY
      }
      y += 8
    }
  }

  // Additional sections
  if (resume.additionalSections && resume.additionalSections.length > 0) {
    for (const section of resume.additionalSections) {
      addSectionHeader(section.title)
      doc.setFont(fontFamily, "normal")
      doc.setFontSize(Math.round(10 * fontScale)) // Apply font scale
      doc.setTextColor(...TEXT_COLOR)
      for (const item of section.items) {
        const itemLines = doc.splitTextToSize(`${bulletChar}  ${sanitizeText(item)}`, contentWidth - 12)
        for (const line of itemLines) {
          checkPageBreak(LINE_HEIGHT_BODY)
          doc.text(line, margin, y)
          y += LINE_HEIGHT_BODY
        }
      }
    }
  }

  return doc.output("datauristring").split(",")[1]
}

function generateInterviewGuidePdf(resume: ResumeData): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 19
  let y = margin

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("INTERVIEW PREPARATION GUIDE", pageWidth / 2, y, { align: "center" })
  y += 10

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Position: ${resume.jobMetadata?.jobTitle || "N/A"} at ${resume.jobMetadata?.companyName || "N/A"}`,
    pageWidth / 2,
    y,
    {
      align: "center",
    },
  )
  y += 6
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" })
  y += 12

  // Projects by Experience
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(45, 106, 79)
  doc.text("PROJECTS BY EXPERIENCE", margin, y)
  y += 8
  doc.setTextColor(0, 0, 0)

  if (resume.interviewGuide?.experienceProjects) {
    for (const exp of resume.interviewGuide.experienceProjects) {
      checkPageBreak(40)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text(`${exp.title} at ${exp.company}`, margin, y)
      y += 6

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      const contextText = `Industry: ${exp.companyContext.industry} | Size: ${exp.companyContext.companySize} | Products: ${exp.companyContext.mainProducts.join(", ")} | Market: ${exp.companyContext.targetMarket}`
      const contextLines = doc.splitTextToSize(contextText, pageWidth - margin * 2)
      doc.text(contextLines, margin, y)
      y += contextLines.length * 4 + 4

      for (const project of exp.projects) {
        checkPageBreak(50)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text(`PROJECT: ${project.projectName}`, margin + 5, y)
        y += 5

        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)

        doc.text(`Product/Service: ${project.productOrService}`, margin + 5, y)
        y += 4

        const descLines = doc.splitTextToSize(project.description, pageWidth - margin * 2 - 10)
        doc.text(descLines, margin + 5, y)
        y += descLines.length * 4 + 2

        const contextLines = doc.splitTextToSize(
          `Business Context: ${project.businessContext}`,
          pageWidth - margin * 2 - 10,
        )
        doc.text(contextLines, margin + 5, y)
        y += contextLines.length * 4 + 4

        doc.setFont("helvetica", "bold")
        doc.text("Challenges:", margin + 5, y)
        y += 4
        doc.setFont("helvetica", "normal")
        for (const challenge of project.challenges) {
          checkPageBreak(8)
          const lines = doc.splitTextToSize(`• ${challenge}`, pageWidth - margin * 2 - 15)
          doc.text(lines, margin + 10, y)
          y += lines.length * 4 + 1
        }
        y += 2

        checkPageBreak(8)
        doc.setFont("helvetica", "bold")
        doc.text("Solutions:", margin + 5, y)
        y += 4
        doc.setFont("helvetica", "normal")
        for (const solution of project.solutions) {
          checkPageBreak(8)
          const lines = doc.splitTextToSize(`• ${solution}`, pageWidth - margin * 2 - 15)
          doc.text(lines, margin + 10, y)
          y += lines.length * 4 + 1
        }
        y += 2

        checkPageBreak(8)
        doc.setFont("helvetica", "bold")
        doc.text("Outcomes:", margin + 5, y)
        y += 4
        doc.setFont("helvetica", "normal")
        for (const outcome of project.outcomes) {
          checkPageBreak(8)
          const lines = doc.splitTextToSize(`• ${outcome}`, pageWidth - margin * 2 - 15)
          doc.text(lines, margin + 10, y)
          y += lines.length * 4 + 1
        }
        y += 4
      }
    }
  }

  // Behavioral Questions
  checkPageBreak(20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(45, 106, 79)
  doc.text("BEHAVIORAL INTERVIEW QUESTIONS", margin, y)
  y += 8
  doc.setTextColor(0, 0, 0)

  if (resume.interviewGuide?.behavioralQuestions) {
    for (let i = 0; i < resume.interviewGuide.behavioralQuestions.length; i++) {
      const q = resume.interviewGuide.behavioralQuestions[i]
      checkPageBreak(20)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      const qLines = doc.splitTextToSize(`Q${i + 1}: ${q.question}`, pageWidth - margin * 2)
      doc.text(qLines, margin, y)
      y += qLines.length * 4 + 3

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(`Suggested Project: ${q.suggestedProject}`, margin + 5, y)
      y += 5

      doc.setFont("helvetica", "bold")
      doc.text("Key Points (STAR Method):", margin + 5, y)
      y += 4
      doc.setFont("helvetica", "normal")
      for (const point of q.keyPoints) {
        checkPageBreak(8)
        const lines = doc.splitTextToSize(`• ${point}`, pageWidth - margin * 2 - 10)
        doc.text(lines, margin + 10, y)
        y += lines.length * 4 + 1
      }
      y += 3
    }
  }

  // Technical Topics
  checkPageBreak(20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(45, 106, 79)
  doc.text("TECHNICAL TOPICS TO PREPARE", margin, y)
  y += 8
  doc.setTextColor(0, 0, 0)

  if (resume.interviewGuide?.technicalTopics) {
    for (const topic of resume.interviewGuide.technicalTopics) {
      checkPageBreak(20)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text(`TOPIC: ${topic.topic}`, margin, y)
      y += 5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      const contextLines = doc.splitTextToSize(`Context: ${topic.projectContext}`, pageWidth - margin * 2 - 5)
      doc.text(contextLines, margin + 5, y)
      y += contextLines.length * 4 + 3

      doc.setFont("helvetica", "bold")
      doc.text("Depth Points:", margin + 5, y)
      y += 4
      doc.setFont("helvetica", "normal")
      for (const point of topic.depthPoints) {
        checkPageBreak(8)
        const lines = doc.splitTextToSize(`• ${point}`, pageWidth - margin * 2 - 10)
        doc.text(lines, margin + 10, y)
        y += lines.length * 4 + 1
      }
      y += 4
    }
  }

  return doc.output("dataurlstring").split(",")[1]
}

function generateEmbellishmentInstructions(level: number): string {
  if (level === 0) {
    return `**LEVEL 0 - PURE ENHANCEMENT (0% Fabrication):**
- ONLY improve wording, grammar, and sentence structure
- DO NOT add any information not explicitly stated in the original resume
- DO NOT embellish or exaggerate any achievements or metrics
- DO NOT add new skills, experiences, or accomplishments
- Preserve ALL original facts, numbers, and details exactly as stated
- Focus solely on clarity, professional language, and ATS optimization
- If metrics exist, keep them exactly as stated - do not round up or enhance
- This is essentially a professional editing pass, not a creative rewrite`
  }

  if (level <= 2) {
    return `**LEVEL ${level} - MINOR POLISH (${level * 10}% Enhancement):**
- Improve wording and professional language throughout
- Slightly refine existing metrics (e.g., "approximately 20%" can become "20%+")
- Add minor clarifying details that are reasonable inferences from the context
- Enhance action verbs and sentence structure
- DO NOT add new achievements or experiences
- DO NOT significantly change any numbers or metrics
- Keep embellishments minimal and easily defensible`
  }

  if (level <= 4) {
    return `**LEVEL ${level} - LIGHT EMBELLISHMENT (${level * 10}% Enhancement):**
- Enhance existing achievements with reasonable improvements
- Moderately improve metrics where logical (e.g., 15% improvement might become 18%)
- Add plausible soft skills and minor responsibilities that fit the role
- Expand on existing bullet points with reasonable additional context
- May add 1-2 minor skills that are common for someone in this role
- Keep all major facts truthful - embellish details, not core accomplishments`
  }

  if (level <= 6) {
    return `**LEVEL ${level} - MODERATE ENHANCEMENT (${level * 10}% Enhancement):**
- Significantly enhance achievements and impact statements
- Improve metrics by reasonable margins (within 25-40% of original)
- Add relevant skills and experiences that align with the target job
- Create more impressive-sounding project descriptions
- May add certifications from smaller/niche organizations (NOT major corps like Google/Amazon)
- Fabricate reasonable secondary accomplishments that support primary ones
- Balance enhancement with plausibility - everything should be believable`
  }

  if (level <= 8) {
    return `**LEVEL ${level} - HEAVY EMBELLISHMENT (${level * 10}% Enhancement):**
- Substantially enhance all achievements and impact statements
- Double or significantly improve most metrics
- Add multiple relevant skills, tools, and technologies
- Create compelling project narratives that showcase ideal qualifications
- Add leadership experiences and cross-functional collaboration stories
- Fabricate impressive but believable accomplishments
- May create minor additional work experiences or projects
- Focus on making the candidate appear highly qualified for the specific role`
  }

  if (level <= 10) {
    return `**LEVEL ${level} - MAXIMUM CREATIVITY (${level * 10}% Enhancement):**
- Transform the resume into an ideal candidate profile
- Create highly impressive metrics and achievements
- Add all relevant skills mentioned in the job description
- Fabricate compelling projects and leadership experiences
- Create a narrative of exceptional performance and impact
- Generate credentials and certifications (from niche/smaller organizations)
- Only preserve: name, contact info, company names, job titles, and approximate dates
- Everything else should be optimized for maximum appeal to the target role`
  }

  // Level 11 - Full Fabrication
  return `**LEVEL 11 - FULL FABRICATION (110% - Complete Creative License):**
- CREATE THE PERFECT RESUME FOR THIS SPECIFIC JOB DESCRIPTION
- ONLY PRESERVE: Name, email, phone, LinkedIn, and basic personal details
- IGNORE all other content from the original resume
- Generate the ideal work history, skills, and achievements for this role
- Create impressive but realistic-sounding companies and projects if needed
- Fabricate perfect metrics and accomplishments
- Add all skills and technologies mentioned in the job description
- Create a compelling career narrative that perfectly matches the role
- Generate relevant certifications and credentials (from believable smaller organizations)
- The goal is to create the most competitive resume possible for this specific job
- Make it believable - avoid over-the-top claims that would raise red flags`
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  const logs: Array<{ type: string; message: string; data?: string }> = []
  const requestStartTime = Date.now()

  const log = (type: "info" | "success" | "error" | "warning" | "request", message: string, data?: unknown) => {
    const logMessage = `[${requestId}] ${message}`
    logs.push({ type, message: logMessage, data })
    console.log(`[v0] [${type.toUpperCase()}] ${logMessage}`, data !== undefined ? data : "")
  }

  try {
    log("info", "Resume optimization request received")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check authentication and credits/subscription
    if (!user) {
      log("error", "Unauthenticated request")
      return Response.json(
        { error: "You must be logged in to optimize resumes. Please sign in and try again.", logs },
        { status: 401 },
      )
    }

    // Fetch user profile for credits/subscription check
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("subscription_status, credits_remaining")
      .eq("id", user.id)
      .single()

    const isPro = userProfile?.subscription_status === "pro"
    const credits = userProfile?.credits_remaining ?? 0

    if (!isPro && credits <= 0) {
      log("error", "User has no credits remaining")
      return Response.json(
        {
          error: "You have no credits remaining. Please upgrade to Pro or purchase more credits.",
          logs,
          needsCredits: true,
        },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const resumeFile = formData.get("resume") as File
    const jobDescription = formData.get("jobDescription") as string
    const apiKey = formData.get("apiKey") as string | null
    const modelParam = formData.get("model") as string | null
    const embellishmentLevelParam = formData.get("embellishmentLevel") as string | null
    const embellishmentLevel = embellishmentLevelParam ? Number.parseInt(embellishmentLevelParam, 10) : 5
    const generateCoverLetterParam = formData.get("generateCoverLetter") as string | null
    const generateCoverLetter = generateCoverLetterParam === "true"

    // Parse style options from form data
    const styleOptionsRaw = formData.get("styleOptions")
    let styleOptions: StyleOptions = DEFAULT_STYLE

    if (styleOptionsRaw && typeof styleOptionsRaw === "string") {
      try {
        const parsed = JSON.parse(styleOptionsRaw)
        styleOptions = {
          fontFamily: parsed.fontFamily || DEFAULT_STYLE.fontFamily,
          fontScale: parsed.fontScale || DEFAULT_STYLE.fontScale,
          colorScheme: parsed.colorScheme || DEFAULT_STYLE.colorScheme,
          // Assign customColor if it exists in parsed options
          customColor: parsed.customColor || DEFAULT_STYLE.customColor,
          nameHeaderAlignment: parsed.nameHeaderAlignment || DEFAULT_STYLE.nameHeaderAlignment,
          headerAlignment: parsed.headerAlignment || DEFAULT_STYLE.headerAlignment,
          margins: parsed.margins || DEFAULT_STYLE.margins,
          sectionSpacing: parsed.sectionSpacing || DEFAULT_STYLE.sectionSpacing,
          skillsStyle: parsed.skillsStyle || DEFAULT_STYLE.skillsStyle,
          bulletStyle: parsed.bulletStyle || DEFAULT_STYLE.bulletStyle,
          dividerStyle: parsed.dividerStyle || DEFAULT_STYLE.dividerStyle,
          nameSize: parsed.nameSize || DEFAULT_STYLE.nameSize,
          nameStyle: parsed.nameStyle || DEFAULT_STYLE.nameStyle,
          datePosition: parsed.datePosition || DEFAULT_STYLE.datePosition,
          includePhoto: parsed.includePhoto ?? DEFAULT_STYLE.includePhoto,
          photoPosition: parsed.photoPosition || DEFAULT_STYLE.photoPosition,
        }
        log("info", `Parsed style options: ${JSON.stringify(styleOptions)}`)
      } catch (e) {
        log("warning", `Failed to parse style options, using defaults: ${e}`)
      }
    }

    const avatarUrl = formData.get("avatarUrl") as string | null

    let avatarBase64: string | null = null
    if (avatarUrl && styleOptions.includePhoto) {
      log("info", "Fetching avatar image for PDF", avatarUrl)
      avatarBase64 = await fetchAvatarAsBase64(avatarUrl)
      if (avatarBase64) {
        log("info", "Avatar image converted to base64 successfully")
      } else {
        log("warning", "Failed to fetch/convert avatar image")
      }
    }

    const selectedModel = modelParam || "gemini-2.5-flash"

    let effectiveApiKey = apiKey?.trim()

    if (!effectiveApiKey && user) {
      // Try to get API key from user profile
      const { data: profile } = await supabase.from("user_profiles").select("google_api_key").eq("id", user.id).single()

      if (profile?.google_api_key) {
        effectiveApiKey = profile.google_api_key
        log("info", "Using API key from user profile")
      }
    }

    if (!effectiveApiKey) {
      effectiveApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      log("info", "Using default environment API key")
    }

    if (!effectiveApiKey) {
      log("error", "No API key available")
      return Response.json(
        { error: "No API key available. Please provide a Google Gemini API key or configure one in Settings.", logs },
        { status: 400 },
      )
    }

    // Allow empty job description if embellishment level is very high, as the AI will generate it.
    if (!jobDescription && embellishmentLevel < 11) {
      log("error", "Missing job description")
      return Response.json({ error: "Job description is required.", logs }, { status: 400 })
    }

    if (!resumeFile) {
      log("error", "Missing resume file")
      return Response.json({ error: "Resume file is required.", logs }, { status: 400 })
    }

    log("info", "Inputs validated. File: " + resumeFile.name + " Size: " + resumeFile.size + " bytes")
    log("info", `Embellishment level: ${embellishmentLevel} (${embellishmentLevel * 10}%)`)
    log("info", `Style Options: ${JSON.stringify(styleOptions)}`)

    const arrayBuffer = await resumeFile.arrayBuffer()
    log(`[v0] ArrayBuffer size: ${arrayBuffer.byteLength}`)

    const resumeText = await extractTextFromDocx(arrayBuffer)
    log(`[v0] Successfully extracted ${resumeText.length} characters from DOCX`)

    // If job description is empty and it's a full fabrication, we don't strictly need resume text.
    // However, a basic resume is still helpful for context. If it's truly empty, we can proceed.
    if (!resumeText && embellishmentLevel < 11) {
      log("error", "No text extracted from document")
      return Response.json({ error: "The uploaded document appears to be empty.", logs }, { status: 400 })
    }

    const embellishmentInstructions = generateEmbellishmentInstructions(embellishmentLevel)

    const prompt = `ROLE: Professional Resume Optimizer

TASK: Optimize the resume for the job description and return structured JSON with an interview guide.

=== OPTIMIZATION REQUIREMENTS ===

**SUMMARY:** 300-350 characters, emphasizing 10+ years experience if applicable.

**KEY SKILLS:** 20-30 individual skills. CRITICAL: Each skill must be a SINGLE item (e.g., "Python", "AWS", "Project Management"). NO groupings like "Cloud (AWS/Azure)". Most job-relevant skills first.

**EXPERIENCE BULLETS (6-9 per job, 150-200 characters each):**
- Action-oriented, starting with strong verbs
- Quantify achievements (%, $, time saved)
- NEVER repeat same action verb across bullets (use: Led, Drove, Built, Architected, Spearheaded, Orchestrated, Streamlined, Delivered, Partnered, Resolved instead of repeating "Implemented" or "Collaborated")
- Past tense for all roles including current
- Correct grammar, spelling, punctuation
- Consistent terminology (e.g., 'cross-functional' not 'crossfunctional')
- ATS optimized with job description keywords

${embellishmentInstructions}

**BULLET VARIATION:** Mix sentence structures, lengths, and metric types. Use diverse openers (action verb, context first, result first, collaboration).

**INTERVIEW GUIDE:** For each company, include company context (research if public, fabricate realistically if not). Generate 2-4 specific projects per role with challenges, solutions, outcomes. Include 5-8 behavioral questions and 4-6 technical topics.

=== JSON OUTPUT ===
Respond with ONLY valid JSON matching the schema. All nullable fields use null if empty. Arrays use [] if empty.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}
`

    log("info", "Calling Google Gemini API for structured output...")
    const aiStartTime = Date.now()

    try {
      const resumeData = await callGeminiAPI(prompt, effectiveApiKey, selectedModel)

      const aiProcessingTime = Date.now() - aiStartTime
      log("success", `Structured response received in ${aiProcessingTime}ms`)
      log("info", `Skill categories count: ${resumeData.keySkills?.length || 0}`)
      log("info", `Experience count: ${resumeData.experience?.length || 0}`)

      const pdfBase64 = generatePdf(resumeData, styleOptions, avatarBase64) // Pass style options and avatarBase64
      const interviewGuidePdfBase64 = generateInterviewGuidePdf(resumeData)

      const docxBase64 = generateDocx(resumeData, styleOptions)

      // Removed cover letter generation code
      log("info", "Interview guide PDF generated")

      // Deduct credit if user is not on Pro plan
      if (!isPro && user) {
        log("info", `[CREDIT DEDUCT] Starting deduction for user ${user.id}. Current credits: ${credits}`)

        const { error: creditError } = await supabase
          .from("user_profiles")
          .update({
            credits_remaining: credits - 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (creditError) {
          log("warning", `Failed to deduct credit: ${creditError.message}`)
        } else {
          log("info", `Credit deducted. Remaining: ${credits - 1}`)
          const { data: verifyProfile } = await supabase
            .from("user_profiles")
            .select("credits_remaining")
            .eq("id", user.id)
            .single()
          log("info", `[CREDIT VERIFY] Database now shows: ${verifyProfile?.credits_remaining} credits`)
        }
      }

      const totalProcessingTime = Date.now() - requestStartTime
      log("success", `PDF generated successfully in ${totalProcessingTime}ms total`)

      try {
        const { error: historyError } = await supabase.from("resume_history").insert({
          user_id: user.id,
          job_title: resumeData.jobMetadata?.jobTitle || "Unknown Position",
          company_name: resumeData.jobMetadata?.companyName || "Unknown Company",
          job_description: jobDescription,
          generated_resume_docx: docxBase64,
          generated_resume_pdf: pdfBase64,
          interview_guide_pdf: interviewGuidePdfBase64,
          model: selectedModel,
          embellishment_level: embellishmentLevel,
          style_options: styleOptions,
          created_at: new Date().toISOString(),
        })

        if (historyError) {
          log("error", "Failed to save to history", historyError.message)
        } else {
          log(
            "success",
            `Saved to history: ${resumeData.jobMetadata?.jobTitle} at ${resumeData.jobMetadata?.companyName}`,
          )
        }
      } catch (historyErr) {
        log("error", "History save error", historyErr instanceof Error ? historyErr.message : "Unknown error")
      }

      return Response.json({
        success: true,
        pdfBase64,
        docxBase64,
        interviewGuidePdfBase64,
        jobTitle: resumeData.jobMetadata?.jobTitle,
        companyName: resumeData.jobMetadata?.companyName,
        creditsRemaining: isPro ? -1 : credits - 1, // Indicate remaining credits
        logs,
        debug: {
          prompt: prompt.substring(0, 500) + "...",
          resumeTextLength: resumeText.length,
          jobDescriptionLength: jobDescription.length,
          processingTime: aiProcessingTime,
          totalTime: Date.now() - requestStartTime,
          model: selectedModel,
          skillCategoriesCount: resumeData.keySkills?.length || 0,
          experienceCount: resumeData.experience?.length || 0,
          extractedResumePreview: resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : ""),
        },
      })
    } catch (aiError: unknown) {
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
      const errorStack = aiError instanceof Error ? aiError.stack : undefined
      log("error", "Google Gemini API error (full details):", errorMessage)
      if (errorStack) {
        log("error", "Error stack trace:", errorStack)
      }

      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid")) {
        return Response.json(
          { error: "Invalid API key. Please check your Google Gemini API key.", logs },
          { status: 401 },
        )
      }
      if (errorMessage.includes("quota") || errorMessage.includes("QUOTA_EXCEEDED")) {
        return Response.json({ error: "API quota exceeded. Please try again later.", logs }, { status: 429 })
      }
      if (errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT") || errorMessage.includes("AbortError")) {
        return Response.json({ error: `Request timeout: ${errorMessage}`, logs }, { status: 504 })
      }

      return Response.json({ error: `AI processing failed: ${errorMessage}`, logs }, { status: 500 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    log("error", "Unexpected error", errorMessage)
    return Response.json({ error: `An unexpected error occurred: ${errorMessage}`, logs }, { status: 500 })
  }
}

function formatForDisplay(resume: ResumeData): string {
  const lines: string[] = []

  lines.push(resume.name)
  if (resume.professionalTitle) lines.push(resume.professionalTitle)

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

  if (resume.keySkills?.length) {
    lines.push("KEY SKILLS")
    for (const skillCategory of resume.keySkills) {
      lines.push(skillCategory)
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
      const details = [edu.graduationDate, edu.details].filter(Boolean)
      if (details.length) lines.push(details.join(" | "))
      lines.push("")
    }
  }

  if (resume.certifications && resume.certifications.length > 0) {
    lines.push("CERTIFICATIONS")
    for (const cert of resume.certifications) {
      lines.push(`• ${cert.name}${cert.issuer ? ` | ${cert.issuer}` : ""}${cert.date ? ` | ${cert.date}` : ""}`)
    }
    lines.push("")
  }

  if (resume.projects && resume.projects.length > 0) {
    lines.push("PROJECTS")
    for (const project of resume.projects) {
      lines.push(`${project.name}${project.link ? ` | ${project.link}` : ""}`)
      lines.push(`• ${project.description}`)
      if (project.technologies && project.technologies.length > 0) {
        lines.push(`Technologies: ${project.technologies.join(", ")}`)
      }
      lines.push("")
    }
  }

  if (resume.additionalSections && resume.additionalSections.length > 0) {
    for (const section of resume.additionalSections) {
      lines.push(section.title.toUpperCase())
      for (const item of section.items) {
        lines.push(`• ${item}`)
      }
      lines.push("")
    }
  }

  if (resume.interviewGuide?.experienceProjects && resume.interviewGuide.experienceProjects.length > 0) {
    lines.push("INTERVIEW GUIDE - EXPERIENCE PROJECTS")
    for (const expProj of resume.interviewGuide.experienceProjects) {
      lines.push(`Company: ${expProj.company}`)
      const mainProducts = expProj.companyContext?.mainProducts?.join(", ") || "N/A"
      lines.push(
        `  Context: Industry: ${expProj.companyContext?.industry || "N/A"}, Size: ${expProj.companyContext?.companySize || "N/A"}, Products: ${mainProducts}, Market: ${expProj.companyContext?.targetMarket || "N/A"}, Known For: ${expProj.companyContext?.knownFor || "N/A"} (${expProj.companyContext?.isPubliclyKnown ? "Public" : "Fabricated"})`,
      )
      lines.push(`Role: ${expProj.title}`)
      if (expProj.projects) {
        for (const project of expProj.projects) {
          lines.push(`  Project: ${project.projectName}`)
          lines.push(`    Product/Service: ${project.productOrService}`)
          lines.push(`    Description: ${project.description}`)
          lines.push(`    Business Context: ${project.businessContext}`)
          lines.push(`    Challenges: ${project.challenges?.join(", ") || "N/A"}`)
          lines.push(`    Solutions: ${project.solutions?.join(", ") || "N/A"}`)
          lines.push(`    Outcomes: ${project.outcomes?.join(", ") || "N/A"}`)
          lines.push(`    Related Bullets: ${project.relatedBullets?.map((i) => `#${i + 1}`).join(", ") || "N/A"}`)
          lines.push(`    Talking Points: ${project.talkingPoints?.join(", ") || "N/A"}`)
        }
      }
      lines.push("")
    }
  }

  if (resume.interviewGuide?.behavioralQuestions && resume.interviewGuide.behavioralQuestions.length > 0) {
    lines.push("INTERVIEW GUIDE - BEHAVIORAL QUESTIONS")
    for (const question of resume.interviewGuide.behavioralQuestions) {
      lines.push(`  Question: ${question.question}`)
      lines.push(`    Suggested Project: ${question.suggestedProject}`)
      lines.push(`    Key Points: ${question.keyPoints?.join(", ") || "N/A"}`)
    }
    lines.push("")
  }

  if (resume.interviewGuide?.technicalTopics && resume.interviewGuide.technicalTopics.length > 0) {
    lines.push("INTERVIEW GUIDE - TECHNICAL TOPICS")
    for (const topic of resume.interviewGuide.technicalTopics) {
      lines.push(`  Topic: ${topic.topic}`)
      lines.push(`    Project Context: ${topic.projectContext}`)
      lines.push(`    Depth Points: ${topic.depthPoints?.join(", ") || "N/A"}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  // Use mammoth for DOCX extraction
  try {
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error("Error extracting text from DOCX:", error)
    // Fallback to PizZip/Docxtemplater if mammoth fails or for older formats
    try {
      const zip = new PizZip(arrayBuffer)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })
      return doc.getFullText()
    } catch (legacyError) {
      console.error("Legacy DOCX extraction also failed:", legacyError)
      return ""
    }
  }
}

function calculateEducationHeight(education: any): number {
  const LINE_HEIGHT_BODY = 14 // ~1.15 line spacing for 10pt
  const LINE_HEIGHT_SMALL = 12 // For smaller text
  if (!education || education.length === 0) return 0
  let height = 24 // Section header height
  for (const edu of education) {
    height += LINE_HEIGHT_BODY // degree/institution line
    const hasDetails = edu.graduationDate || edu.details
    if (hasDetails) height += LINE_HEIGHT_SMALL
    height += 8 // spacing between items
  }
  return height
}

function calculateCertificationsHeight(certifications: any): number {
  const LINE_HEIGHT_BODY = 14 // ~1.15 line spacing for 10pt
  if (!certifications || certifications.length === 0) return 0
  let height = 24 // Section header height
  height += certifications.length * LINE_HEIGHT_BODY // Each cert line
  height += 10 // bottom spacing
  return height
}
