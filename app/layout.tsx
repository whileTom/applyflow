import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://applyflow.dev"
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ""

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ApplyFlow - AI-Powered Resume Optimization",
    template: "%s | ApplyFlow",
  },
  description:
    "Streamline your path from application to offer. Optimize resumes with AI, generate interview guides, and land your dream job faster.",
  keywords: [
    "resume optimization",
    "AI resume",
    "job application",
    "resume builder",
    "interview preparation",
    "career tools",
    "job search",
    "resume tailoring",
    "ATS optimization",
  ],
  authors: [{ name: "ApplyFlow" }],
  creator: "ApplyFlow",
  publisher: "ApplyFlow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-96x96.png",
        type: "image/png",
        sizes: "96x96",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ApplyFlow",
    title: "ApplyFlow - AI-Powered Resume Optimization",
    description:
      "Streamline your path from application to offer. Optimize resumes with AI, generate interview guides, and land your dream job faster.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ApplyFlow - AI-Powered Resume Optimization",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyFlow - AI-Powered Resume Optimization",
    description:
      "Streamline your path from application to offer. Optimize resumes with AI, generate interview guides, and land your dream job faster.",
    images: ["/og-image.png"],
    creator: "@applyflow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {googleAdsId && (
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`} strategy="afterInteractive" />
        )}
        {googleAdsId && (
          <Script id="google-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAdsId}');
            `}
          </Script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "ApplyFlow",
              description:
                "AI-powered resume optimization tool that helps job seekers tailor their resumes and prepare for interviews.",
              url: siteUrl,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free tier with 3 resume optimizations",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1000",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <SonnerToaster />
        <Analytics />
      </body>
    </html>
  )
}
