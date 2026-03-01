/**
 * End-to-end test for Resume Optimization
 * This test runs against the deployed application
 * and verifies that the Gemini API integration works correctly
 */

const fs = require("fs")
const path = require("path")

// Configuration
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, "../data")

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function authenticateUser() {
  log("\n🔐 Authenticating test user...", colors.blue)

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment variables")
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    }),
  })

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`)
  }

  // Extract cookies from response
  const cookies = response.headers.get("set-cookie")
  log("✓ Authentication successful", colors.green)

  return cookies
}

async function testResumeOptimization(cookies) {
  log("\n🚀 Testing resume optimization...", colors.blue)

  // Load test resume - try .docx first, fall back to .txt
  let testResumePath = path.join(TEST_DATA_DIR, "test-resume.docx")
  if (!fs.existsSync(testResumePath)) {
    testResumePath = path.join(TEST_DATA_DIR, "test-resume.txt")
    if (!fs.existsSync(testResumePath)) {
      throw new Error(`Test resume not found at ${testResumePath}`)
    }
  }

  const resumeBuffer = fs.readFileSync(testResumePath)
  const resumeBlob = new Blob([resumeBuffer], {
    type: testResumePath.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "text/plain",
  })

  // Load test job description
  const jobDescPath = path.join(TEST_DATA_DIR, "test-job-description.txt")
  const jobDescription = fs.existsSync(jobDescPath)
    ? fs.readFileSync(jobDescPath, "utf-8")
    : "Senior Software Engineer position requiring expertise in React, Node.js, and TypeScript."

  log(`  Job Description: "${jobDescription.substring(0, 80)}..."`)

  // Create form data
  const formData = new FormData()
  formData.append("resume", resumeBlob, path.basename(testResumePath))
  formData.append("jobDescription", jobDescription)
  formData.append("model", "gemini-2.5-flash")
  formData.append("embellishmentLevel", "5")

  const startTime = Date.now()

  const response = await fetch(`${API_URL}/api/optimize-resume`, {
    method: "POST",
    headers: {
      Cookie: cookies,
    },
    body: formData,
  })

  const duration = Date.now() - startTime

  log(`  Response status: ${response.status}`)
  log(`  Duration: ${duration}ms`)

  if (!response.ok) {
    const errorData = await response.json()

    if (errorData.error && errorData.error.includes("Cannot read properties of undefined")) {
      throw new Error(
        `CRITICAL BUG DETECTED: JSON.stringify error in Gemini API call. ` +
          `This indicates JSON.JSON.stringify or similar typo in the code. ` +
          `Full error: ${errorData.error}`,
      )
    }

    throw new Error(`Optimization failed: ${JSON.stringify(errorData, null, 2)}`)
  }

  const result = await response.json()

  // Validate response structure
  if (!result.success) {
    throw new Error("Response missing success flag")
  }

  if (!result.pdfBase64) {
    throw new Error("Response missing pdfBase64")
  }

  if (!result.interviewGuidePdfBase64) {
    throw new Error("Response missing interviewGuidePdfBase64")
  }

  if (!result.jobTitle || !result.companyName) {
    throw new Error("Response missing job metadata")
  }

  // Verify logs don't contain critical errors
  if (result.logs) {
    const criticalErrors = result.logs.filter(
      (log) => log.type === "error" && log.message.includes("Cannot read properties"),
    )
    if (criticalErrors.length > 0) {
      throw new Error(`Critical errors in logs: ${JSON.stringify(criticalErrors)}`)
    }
  }

  log("✓ Resume optimization successful", colors.green)
  log(`  Job Title: ${result.jobTitle}`)
  log(`  Company: ${result.companyName}`)
  log(`  PDF generated: ${result.pdfBase64.length} bytes`)
  log(`  Interview guide generated: ${result.interviewGuidePdfBase64.length} bytes`)
  log(`  Credits remaining: ${result.creditsRemaining >= 0 ? result.creditsRemaining : "Unlimited (Pro)"}`)

  return result
}

async function runTests() {
  const startTime = Date.now()

  log("=".repeat(60), colors.blue)
  log("  Resume Optimization E2E Test Suite", colors.blue)
  log("=".repeat(60), colors.blue)
  log(`  Environment: ${API_URL}`)
  log(`  Timestamp: ${new Date().toISOString()}`)

  try {
    // Step 1: Authenticate
    const cookies = await authenticateUser()

    // Step 2: Test resume optimization
    const result = await testResumeOptimization(cookies)

    // Success summary
    const totalDuration = Date.now() - startTime
    log("\n" + "=".repeat(60), colors.green)
    log("  ✓ ALL TESTS PASSED", colors.green)
    log("=".repeat(60), colors.green)
    log(`  Total duration: ${totalDuration}ms`)
    log(`  Gemini API: Working correctly`)
    log(`  No JSON.stringify bugs detected`)

    process.exit(0)
  } catch (error) {
    log("\n" + "=".repeat(60), colors.red)
    log("  ✗ TEST FAILED", colors.red)
    log("=".repeat(60), colors.red)
    log(`  Error: ${error.message}`, colors.red)

    if (error.stack) {
      log("\nStack trace:", colors.yellow)
      log(error.stack, colors.yellow)
    }

    process.exit(1)
  }
}

// Run tests
runTests()
