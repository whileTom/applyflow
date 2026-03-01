export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  credits?: number
  isSubscription?: boolean
  isLifetime?: boolean
  features: string[]
  savings?: string
}

export const PRODUCTS: Product[] = [
  {
    id: "credits-1",
    name: "Single Credit",
    description: "Try it out - 1 resume optimization",
    priceInCents: 100, // $1.00
    credits: 1,
    features: ["1 resume optimization", "PDF export", "Interview guide generation", "Never expires"],
  },
  {
    id: "credits-10",
    name: "10 Credits Pack",
    description: "Great for active job seekers",
    priceInCents: 799, // $7.99
    credits: 10,
    savings: "20% off",
    features: [
      "10 resume optimizations",
      "PDF export",
      "Interview guide generation",
      "Never expires",
      "$0.80 per credit",
    ],
  },
  {
    id: "credits-25",
    name: "25 Credits Pack",
    description: "Best value for power users",
    priceInCents: 1499, // $14.99
    credits: 25,
    savings: "40% off",
    features: [
      "25 resume optimizations",
      "PDF export",
      "Interview guide generation",
      "Never expires",
      "$0.60 per credit",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro Monthly",
    description: "Unlimited optimizations for serious job seekers",
    priceInCents: 999, // $9.99/month
    isSubscription: true,
    features: [
      "Unlimited resume optimizations",
      "PDF & DOCX export",
      "Interview guide generation",
      "Advanced AI models",
      "Priority support",
      "Full resume history",
    ],
  },
  {
    id: "pro-lifetime",
    name: "Pro Lifetime",
    description: "One-time payment, unlimited forever",
    priceInCents: 19999, // $199.99
    isLifetime: true,
    savings: "Best deal",
    features: [
      "Unlimited resume optimizations",
      "PDF & DOCX export",
      "Interview guide generation",
      "Advanced AI models",
      "Priority support",
      "Full resume history",
      "Lifetime updates",
      "One-time payment",
    ],
  },
]
