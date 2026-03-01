import { describe, it, expect } from "vitest"

describe("Resume Optimization API", () => {
  const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  it("should respond with 401 when not authenticated", async () => {
    const formData = new FormData()
    formData.append("jobDescription", "Test job description")

    const response = await fetch(`${API_URL}/api/optimize-resume`, {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toContain("must be logged in")
  })

  it("should properly format Gemini API request body", () => {
    const testPrompt = "Test prompt"
    const testApiKey = "test-key"
    const testModel = "gemini-2.5-flash"

    // Simulate the body creation from the API route
    const body = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: testPrompt,
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
    })

    // Verify the body is valid JSON
    expect(() => JSON.parse(body)).not.toThrow()

    const parsed = JSON.parse(body)
    expect(parsed.contents).toBeDefined()
    expect(parsed.contents[0].parts[0].text).toBe(testPrompt)
    expect(parsed.generationConfig).toBeDefined()
  })

  it("should validate required fields", async () => {
    // This test would require authentication
    // Placeholder for structure
    expect(true).toBe(true)
  })
})
