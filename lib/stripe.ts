import "server-only"
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with 3 free resume optimizations",
    priceInCents: 0,
    credits: 3,
    features: ["3 resume optimizations", "PDF export", "Interview guide generation", "Basic AI model"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Unlimited optimizations for serious job seekers",
    priceInCents: 1499, // $14.99/month
    credits: -1, // unlimited
    stripePriceId: "price_pro_monthly",
    features: [
      "Unlimited resume optimizations",
      "PDF & DOCX export",
      "Interview guide generation",
      "Advanced AI models",
      "Priority support",
      "Resume history",
    ],
  },
  credits10: {
    id: "credits10",
    name: "10 Credits",
    description: "Pay as you go - 10 resume optimizations",
    priceInCents: 999, // $9.99
    credits: 10,
    features: ["10 resume optimizations", "PDF export", "Interview guide generation", "Never expires"],
  },
} as const

export type PlanId = keyof typeof PLANS
