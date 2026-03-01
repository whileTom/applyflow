import { sanitizeContent } from "./sanitize"

// Store original btoa function
const originalBtoa = globalThis.btoa

// Override btoa globally to prevent any encoding errors from breaking the app
if (typeof window !== "undefined") {
  globalThis.btoa = function safeBtoa(str: string): string {
    try {
      // Pre-sanitize to remove non-Latin1 characters
      const sanitized = str.replace(/[^\x00-\xFF]/g, "")
      return originalBtoa.call(this, sanitized)
    } catch (error) {
      console.error("[v0] btoa error prevented:", error)
      // Return empty string instead of throwing
      return ""
    }
  }
}

export function encodeToBase64(str: string): string {
  try {
    // Sanitize content first to remove problematic Unicode characters
    const sanitized = sanitizeContent(str)

    // Additional defensive strip of any remaining non-Latin1 characters
    const cleaned = sanitized.replace(/[^\x00-\xFF]/g, "")

    // Now safe to use btoa (which is now our safe wrapper)
    return btoa(cleaned)
  } catch (error) {
    console.error("[v0] Failed to encode to base64:", error)
    return ""
  }
}

export function decodeFromBase64(encodedStr: string): string {
  try {
    return atob(encodedStr)
  } catch (error) {
    console.error("[v0] Failed to decode from base64:", error)
    return ""
  }
}
