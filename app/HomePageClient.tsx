"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, FileText, Zap, ArrowRight, TrendingUp, Users, Target } from "lucide-react"
import Image from "next/image"
import { sanitizeContent } from "@/lib/sanitize"
import { useEffect, useState } from "react"

interface HomePageClientProps {
  appVersion: string
}

export default function HomePageClient({ appVersion }: HomePageClientProps) {
  const [userCount, setUserCount] = useState(312)

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch("/api/user-count", {
          cache: "no-store",
        })
        const data = await response.json()
        setUserCount(data.count || 312)
      } catch (error) {
        console.error("[v0] Failed to fetch user count:", error)
        setUserCount(312)
      }
    }

    fetchUserCount()
  }, [])

  const heroDescription = sanitizeContent(
    "Skip the robots and get noticed by real people. Our AI crafts resumes that pass ATS filters and impress hiring managers, helping you land interviews.",
  )
  const featureDescription = sanitizeContent(
    "Built to help you skip automated screening and connect directly with decision-makers.",
  )
  const aiResumeTailoringDesc = sanitizeContent(
    "Beat the bots. Our AI optimizes your resume to pass automated screenings while keeping it readable and compelling for human recruiters.",
  )
  const interviewGuidesDesc = sanitizeContent(
    "Land the interview with personalized preparation guides. Make yourself the perfect hire by knowing exactly what to expect and how to answer.",
  )
  const instantResultsDesc = sanitizeContent(
    "Get past the robots in seconds. Optimize your resume instantly and apply to more jobs while staying authentic to who you are.",
  )
  const statsDesc = sanitizeContent(
    "Based on internal user data comparing interview callback rates before and after using ApplyFlow's AI-powered resume optimization.",
  )
  const ctaDescription = sanitizeContent(
    "Skip the robotic screening process. Join thousands who've landed interviews by getting noticed by real people.",
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/" className="hidden sm:flex items-center">
          <div className="logo-shimmer" style={{ "--logo-mask": "url(/applyflow-logo.svg)" } as React.CSSProperties}>
            <Image
              src="/applyflow-logo.svg"
              alt="ApplyFlow"
              width={624}
              height={249}
              className="h-39 w-auto transition-opacity hover:opacity-80"
              priority
            />
          </div>
        </Link>
        <div className="flex items-center justify-end sm:justify-end gap-4 w-full sm:w-auto">
          <Button variant="ghost" asChild className="rounded-xl">
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-xl">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
        <Link href="/" className="flex sm:hidden items-center justify-center mt-6 mb-2">
          <div className="logo-shimmer" style={{ "--logo-mask": "url(/logo-w-text.svg)" } as React.CSSProperties}>
            <Image
              src="/logo-w-text.svg"
              alt="ApplyFlow"
              width={624}
              height={249}
              className="h-auto w-full max-w-[300px] transition-opacity hover:opacity-80"
              priority
            />
          </div>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 sm:mb-0"
            style={{
              background: "oklch(0.68 0.16 250)",
              border: "2px solid oklch(0.68 0.16 250)",
              boxShadow: "0 4px 12px oklch(0.68 0.16 250 / 0.3)",
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "oklch(0.98 0.01 280)" }} />
            <span className="text-sm font-medium" style={{ color: "oklch(0.98 0.01 280)" }}>
              AI-Powered Resume Optimization
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Skip the Robots 🤖
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Get Noticed
            </span>{" "}
            <span className="text-foreground">👀</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">{heroDescription}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="pushable" onClick={() => (window.location.href = "/auth/sign-up")}>
              <span className="front">Start Free</span>
            </button>
          </div>

          <p className="mt-8 text-lg md:text-2xl font-bold text-primary">
            <span className="text-white">No credit card required.</span>
            <br />3 free optimizations.
          </p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20">
            <CardContent className="py-10 px-6">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-2xl bg-primary/20 w-fit mb-3">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    93.7%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Increase in interview callbacks with optimized resumes
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-2xl bg-accent/20 w-fit mb-3">
                    <Users className="w-8 h-8 text-accent" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                    {userCount.toLocaleString()}+
                  </div>
                  <p className="text-sm text-muted-foreground">Job seekers have landed interviews with ApplyFlow</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-2xl bg-primary/20 w-fit mb-3">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    3x
                  </div>
                  <p className="text-sm text-muted-foreground">Faster application process with AI optimization</p>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">{statsDesc}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{featureDescription}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="p-3 rounded-2xl bg-primary/10 w-fit mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Resume Tailoring</h3>
              <p className="text-muted-foreground">{aiResumeTailoringDesc}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="p-3 rounded-2xl bg-accent/10 w-fit mb-4">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interview Guides</h3>
              <p className="text-muted-foreground">{interviewGuidesDesc}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="p-3 rounded-2xl bg-muted/50 w-fit mb-4">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
              <p className="text-muted-foreground">{instantResultsDesc}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground text-lg">Land the interview, make yourself the perfect hire</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: "1", title: "Paste Job Description", desc: "Copy the job posting you want to apply for" },
            { step: "2", title: "Upload Resume", desc: "Upload your current resume as a .docx file" },
            { step: "3", title: "Get Results", desc: "Download your tailored resume and interview guide" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="rounded-3xl bg-primary/5 border-primary/20 max-w-4xl mx-auto">
          <CardContent className="py-16 px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get noticed by real people?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{ctaDescription}</p>
            <Button size="lg" asChild className="rounded-xl h-14 px-8 text-lg">
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="logo-shimmer" style={{ "--logo-mask": "url(/applyflow-logo.svg)" } as React.CSSProperties}>
              <Image
                src="/applyflow-logo.svg"
                alt="ApplyFlow"
                width={468}
                height={187}
                className="h-27 w-auto transition-opacity hover:opacity-80"
              />
            </div>
            <span className="text-xs text-muted-foreground">v{appVersion}</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">skip the 🤖, get noticed by 🧑‍💻</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
