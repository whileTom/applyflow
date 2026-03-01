/**
 * Google Ads Conversion Tracking
 * Tracks conversions for Google Ads campaigns.
 * Reads the Ads tag ID from NEXT_PUBLIC_GOOGLE_ADS_ID at build time.
 */

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ""

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void
  }
}

/**
 * Track a conversion event in Google Ads
 * @param conversionLabel - The conversion label from Google Ads (format: AW-XXXXXXXXX/XXXXXXXXXX)
 * @param value - Optional conversion value
 * @param currency - Currency code (default: USD)
 */
export function trackConversion(conversionLabel: string, value?: number, currency = "USD") {
  if (typeof window !== "undefined" && window.gtag) {
    const config: Record<string, unknown> = {
      send_to: conversionLabel,
    }

    if (value !== undefined) {
      config.value = value
      config.currency = currency
    }

    window.gtag("event", "conversion", config)
  }
}

/**
 * Track a purchase conversion
 * @param transactionId - Unique transaction ID
 * @param value - Purchase value
 * @param currency - Currency code (default: USD)
 */
export function trackPurchase(transactionId: string, value: number, currency = "USD") {
  if (typeof window !== "undefined" && window.gtag && GOOGLE_ADS_ID) {
    window.gtag("event", "purchase", {
      send_to: GOOGLE_ADS_ID,
      transaction_id: transactionId,
      value: value,
      currency: currency,
    })
  }
}

/**
 * Track a sign-up conversion
 * Replace 'XXXXXXXXXX' with your actual conversion label from Google Ads
 */
export function trackSignUp() {
  if (!GOOGLE_ADS_ID) return
  // TODO: Replace SIGNUP_LABEL with your actual conversion label from Google Ads
  trackConversion(`${GOOGLE_ADS_ID}/SIGNUP_LABEL`)
}

/**
 * Track a resume optimization conversion
 * Replace 'XXXXXXXXXX' with your actual conversion label from Google Ads
 */
export function trackResumeOptimization() {
  if (!GOOGLE_ADS_ID) return
  // TODO: Replace OPTIMIZATION_LABEL with your actual conversion label from Google Ads
  trackConversion(`${GOOGLE_ADS_ID}/OPTIMIZATION_LABEL`)
}

/**
 * Track a page view
 * @param url - Page URL
 */
export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.gtag && GOOGLE_ADS_ID) {
    window.gtag("config", GOOGLE_ADS_ID, {
      page_path: url,
    })
  }
}
