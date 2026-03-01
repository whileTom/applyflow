export function sanitizeContent(text: string): string {
  if (typeof text !== "string") {
    return String(text)
  }

  // Replace smart quotes with regular quotes
  const sanitized = text
    .replace(/[""]/g, '"') // Smart double quotes
    .replace(/['']/g, "'") // Smart single quotes
    .replace(/–/g, "-") // En dash
    .replace(/—/g, "-") // Em dash
    .replace(/…/g, "...") // Ellipsis
    .replace(/[«»]/g, '"') // Guillemets
    .replace(/[^\x00-\xFF]/g, "") // Remove ALL non-Latin1 characters completely

  return sanitized
}
