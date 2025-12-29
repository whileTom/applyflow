import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import JSZip from "jszip"

export const maxDuration = 60

interface ParagraphMapping {
  index: number
  originalText: string
  xmlPath: string[]
}

function extractTextFromXml(xmlContent: string): { text: string; paragraphs: ParagraphMapping[] } {
  console.log("[API] Parsing document XML structure...")

  const paragraphs: ParagraphMapping[] = []
  let fullText = ""

  // Match all paragraph elements
  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g
  let paragraphMatch
  let paragraphIndex = 0

  while ((paragraphMatch = paragraphRegex.exec(xmlContent)) !== null) {
    const paragraphContent = paragraphMatch[1]

    // Extract all text runs within the paragraph
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let textMatch
    let paragraphText = ""

    while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
      paragraphText += textMatch[1]
    }

    if (paragraphText.trim()) {
      paragraphs.push({
        index: paragraphIndex,
        originalText: paragraphText,
        xmlPath: [paragraphMatch.index.toString()],
      })
      fullText += `[P${paragraphIndex}] ${paragraphText}\n`
      paragraphIndex++
    }
  }

  console.log(`[API] Extracted ${paragraphs.length} paragraphs from document`)
  return { text: fullText, paragraphs }
}

function replaceTextInXml(xmlContent: string, originalParagraphs: ParagraphMapping[], newText: string): string {
  console.log("[API] Mapping AI response back to XML structure...")

  // Parse the AI response to extract paragraph mappings
  const newParagraphMap = new Map<number, string>()
  const lines = newText.split("\n")

  for (const line of lines) {
    const match = line.match(/^\[P(\d+)\]\s*(.*)$/)
    if (match) {
      const idx = Number.parseInt(match[1], 10)
      const text = match[2]
      newParagraphMap.set(idx, text)
    }
  }

  console.log(`[API] Parsed ${newParagraphMap.size} paragraph replacements from AI response`)

  let modifiedXml = xmlContent
  const offset = 0

  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g
  let paragraphMatch
  let currentParagraphIndex = 0

  const replacements: { start: number; end: number; newContent: string }[] = []

  while ((paragraphMatch = paragraphRegex.exec(xmlContent)) !== null) {
    const paragraphContent = paragraphMatch[1]
    const paragraphStart = paragraphMatch.index
    const paragraphEnd = paragraphStart + paragraphMatch[0].length

    // Check if this paragraph has text
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let hasText = false
    let textMatch

    while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
      if (textMatch[1].trim()) {
        hasText = true
        break
      }
    }

    if (hasText) {
      const newTextForParagraph = newParagraphMap.get(currentParagraphIndex)

      if (newTextForParagraph !== undefined) {
        // Replace all text runs in this paragraph with the new text
        // Keep the first text run's formatting and put all text there
        let newParagraphContent = paragraphContent
        let isFirstTextRun = true
        const runOffset = 0

        const runRegex = /<w:r>([\s\S]*?)<\/w:r>/g
        let runMatch
        const runReplacements: { start: number; end: number; newContent: string }[] = []

        while ((runMatch = runRegex.exec(paragraphContent)) !== null) {
          const runContent = runMatch[1]
          const hasTextInRun = /<w:t[^>]*>([^<]*)<\/w:t>/.test(runContent)

          if (hasTextInRun) {
            if (isFirstTextRun) {
              // Replace text in the first run with all the new text
              const newRunContent = runContent.replace(
                /<w:t([^>]*)>[^<]*<\/w:t>/,
                `<w:t$1>${escapeXml(newTextForParagraph)}</w:t>`,
              )
              runReplacements.push({
                start: runMatch.index,
                end: runMatch.index + runMatch[0].length,
                newContent: `<w:r>${newRunContent}</w:r>`,
              })
              isFirstTextRun = false
            } else {
              // Remove subsequent text runs (consolidate text into first run)
              runReplacements.push({
                start: runMatch.index,
                end: runMatch.index + runMatch[0].length,
                newContent: "",
              })
            }
          }
        }

        // Apply run replacements in reverse order to maintain positions
        for (let i = runReplacements.length - 1; i >= 0; i--) {
          const rep = runReplacements[i]
          newParagraphContent =
            newParagraphContent.substring(0, rep.start) + rep.newContent + newParagraphContent.substring(rep.end)
        }

        const fullParagraphTag = paragraphMatch[0].replace(paragraphContent, newParagraphContent)
        replacements.push({
          start: paragraphStart,
          end: paragraphEnd,
          newContent: fullParagraphTag,
        })
      }

      currentParagraphIndex++
    }
  }

  // Apply all replacements in reverse order
  for (let i = replacements.length - 1; i >= 0; i--) {
    const rep = replacements[i]
    modifiedXml = modifiedXml.substring(0, rep.start) + rep.newContent + modifiedXml.substring(rep.end)
  }

  console.log(`[API] Applied ${replacements.length} paragraph replacements to XML`)
  return modifiedXml
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function POST(req: Request) {
  console.log("[API] Resume optimization request received")
  const requestStartTime = Date.now()

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

    let zip: JSZip
    let documentXml: string

    try {
      const arrayBuffer = await resumeFile.arrayBuffer()
      zip = await JSZip.loadAsync(arrayBuffer)
      console.log("[API] DOCX ZIP structure loaded successfully")

      const documentFile = zip.file("word/document.xml")
      if (!documentFile) {
        throw new Error("No document.xml found in DOCX")
      }

      documentXml = await documentFile.async("string")
      console.log("[API] Extracted document.xml, size:", documentXml.length, "characters")
    } catch (zipError) {
      console.log("[API] Error parsing DOCX structure:", zipError)
      return Response.json(
        { error: "Failed to parse the DOCX file structure. Please ensure it's a valid .docx file." },
        { status: 400 },
      )
    }

    const { text: resumeText, paragraphs } = extractTextFromXml(documentXml)

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

IMPORTANT FORMAT INSTRUCTIONS:
- The resume is provided with paragraph markers like [P0], [P1], [P2], etc.
- You MUST preserve these exact markers in your response.
- Rewrite the text after each marker, but keep the marker format exactly as [P#].
- If you want to remove a paragraph, still include the marker with empty text: [P#] 
- Do NOT add new paragraph markers or change the numbering.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME (with paragraph markers):
${resumeText}`

    console.log("[API] Calling Google Gemini API with paragraph-aware prompt...")
    const aiStartTime = Date.now()
    const modelName = "gemini-2.5-flash"

    try {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey,
      })

      const { text: aiResponse } = await generateText({
        model: google(modelName),
        prompt,
        maxOutputTokens: 200000,
        temperature: 0.3,
      })

      const aiProcessingTime = Date.now() - aiStartTime
      console.log("[API] Gemini response received. Output length:", aiResponse.length, "characters")
      console.log("[API] AI processing time:", aiProcessingTime, "ms")

      const modifiedXml = replaceTextInXml(documentXml, paragraphs, aiResponse)

      zip.file("word/document.xml", modifiedXml)

      const newDocxBuffer = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      })

      const totalProcessingTime = Date.now() - requestStartTime
      console.log("[API] New DOCX generated successfully")
      console.log("[API] Total request time:", totalProcessingTime, "ms")

      return Response.json({
        optimizedResume: aiResponse,
        docxBase64: newDocxBuffer,
        debug: {
          prompt: prompt,
          resumeTextLength: resumeText.length,
          jobDescriptionLength: jobDescription.length,
          responseLength: aiResponse.length,
          processingTime: aiProcessingTime,
          totalTime: totalProcessingTime,
          model: `google/${modelName}`,
          paragraphCount: paragraphs.length,
          extractedResumePreview: resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : ""),
        },
      })
    } catch (aiError: unknown) {
      console.log("[API] Gemini API error:", aiError)

      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      const debugInfo = {
        prompt: prompt,
        resumeTextLength: resumeText.length,
        jobDescriptionLength: jobDescription.length,
        model: `google/${modelName}`,
        paragraphCount: paragraphs.length,
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

      if (errorMessage.includes("timeout") || errorMessage.includes("DEADLINE_EXCEEDED")) {
        return Response.json(
          {
            error: "Request timed out. The resume may be too long. Please try with a shorter document.",
            debug: debugInfo,
          },
          { status: 504 },
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
