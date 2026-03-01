export function extractGoogleDriveDocId(url: string): string | null {
  if (!url) return null

  // Handle various Google Drive URL formats
  const patterns = [
    // Standard document URL: https://docs.google.com/document/d/{DOC_ID}/edit
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    // Direct export URL: https://docs.google.com/document/d/{DOC_ID}/export?format=docx
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)\/export/,
    // File URL: https://drive.google.com/file/d/{DOC_ID}/view
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    // Open URL: https://drive.google.com/open?id={DOC_ID}
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  // If no pattern matched, check if the input itself is just a DOC_ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) {
    return url
  }

  return null
}

export function buildGoogleDriveExportUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/export?format=docx`
}
