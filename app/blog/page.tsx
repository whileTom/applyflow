import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Resume & Job Search Blog | ApplyFlow",
  description:
    "Expert insights on ATS optimization, resume writing, job application strategies, and interview preparation. Learn how to land more interviews with AI-powered resume optimization.",
  keywords: [
    "resume tips",
    "ATS optimization",
    "job search strategies",
    "interview preparation",
    "career advice",
    "applicant tracking systems",
  ],
}

const blogPosts = [
  {
    slug: "ats-optimization-guide",
    title: "The Complete Guide to ATS Optimization: Why 75% of Resumes Never Reach Human Eyes",
    description:
      "Discover how Applicant Tracking Systems work and why optimizing your resume for ATS is crucial for landing interviews in 2026.",
    date: "January 5, 2026",
    readTime: "12 min",
    featured: true,
  },
  {
    slug: "resume-keywords-that-work",
    title: "50+ Resume Keywords That Actually Get You Interviews",
    description:
      "Industry-specific keywords and phrases that help your resume pass ATS screening and impress hiring managers.",
    date: "January 4, 2026",
    readTime: "8 min",
  },
  {
    slug: "common-ats-mistakes",
    title: "10 ATS Resume Mistakes That Are Costing You Interviews",
    description:
      "Avoid these common formatting and content errors that cause ATS systems to reject otherwise qualified candidates.",
    date: "January 3, 2026",
    readTime: "7 min",
  },
  {
    slug: "tailoring-resume-job-posting",
    title: "How to Tailor Your Resume to Any Job Posting in 10 Minutes",
    description: "A step-by-step guide to customizing your resume for each application without starting from scratch.",
    date: "January 2, 2026",
    readTime: "9 min",
  },
  {
    slug: "resume-format-2026",
    title: "Best Resume Format for 2026: What Actually Works",
    description: "The latest research on resume formatting, length, and design that leads to more interview callbacks.",
    date: "January 1, 2026",
    readTime: "10 min",
  },
  {
    slug: "quantify-resume-achievements",
    title: "How to Quantify Your Resume Achievements (With Examples)",
    description:
      "Transform vague job descriptions into powerful, measurable accomplishments that catch recruiter attention.",
    date: "December 30, 2025",
    readTime: "8 min",
  },
  {
    slug: "job-application-strategy",
    title: "The Strategic Job Application Method: Quality Over Quantity",
    description: "Why applying to 100 jobs with a generic resume gets worse results than 10 tailored applications.",
    date: "December 28, 2025",
    readTime: "11 min",
  },
  {
    slug: "linkedin-resume-alignment",
    title: "Aligning Your Resume and LinkedIn Profile for Maximum Impact",
    description:
      "Ensure consistency across your professional brand while optimizing both platforms for different purposes.",
    date: "December 26, 2025",
    readTime: "9 min",
  },
  {
    slug: "career-change-resume",
    title: "Writing a Resume for Career Change: Expert Strategies",
    description:
      "How to position transferable skills and demonstrate value when transitioning to a new industry or role.",
    date: "December 24, 2025",
    readTime: "12 min",
  },
  {
    slug: "interview-preparation-checklist",
    title: "The Ultimate Interview Preparation Checklist",
    description:
      "Everything you need to do before, during, and after an interview to maximize your chances of getting an offer.",
    date: "December 20, 2025",
    readTime: "10 min",
  },
  {
    slug: "salary-negotiation-guide",
    title: "Salary Negotiation: How to Ask for 15-20% More (And Get It)",
    description: "Research-backed strategies for negotiating higher compensation without jeopardizing your offer.",
    date: "December 18, 2025",
    readTime: "13 min",
  },
  {
    slug: "remote-job-search",
    title: "Finding Remote Jobs: Where to Look and How to Stand Out",
    description:
      "The best job boards, strategies, and resume tweaks for landing remote positions in competitive markets.",
    date: "December 16, 2025",
    readTime: "9 min",
  },
  {
    slug: "skills-section-optimization",
    title: "Optimizing Your Skills Section for ATS and Human Readers",
    description:
      "How to structure and prioritize your skills to pass automated screening while showcasing your expertise.",
    date: "December 14, 2025",
    readTime: "8 min",
  },
  {
    slug: "job-search-productivity",
    title: "Job Search Productivity: How to Apply to 20+ Quality Jobs Per Week",
    description: "Time-saving systems and tools that allow you to maintain high application quality at scale.",
    date: "December 12, 2025",
    readTime: "11 min",
  },
]

export default function BlogPage() {
  const featured = blogPosts.find((post) => post.featured)
  const regular = blogPosts.filter((post) => !post.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Button variant="ghost" asChild className="rounded-xl">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="rounded-xl">
            <Link href="/faq">FAQ</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-xl">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Resume & Job Search Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Expert insights on ATS optimization, resume writing, and job search strategies to help you land your dream
          job.
        </p>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="container mx-auto px-4 py-8 max-w-5xl">
          <Card className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20">
            <CardHeader>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-4 w-fit">
                Featured Article
              </div>
              <CardTitle className="text-3xl mb-2">{featured.title}</CardTitle>
              <CardDescription className="text-base">{featured.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{featured.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featured.readTime} read
                  </span>
                </div>
                <Button asChild className="rounded-xl">
                  <Link href={`/blog/${featured.slug}`}>
                    Read Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regular.map((post) => (
            <Card key={post.slug} className="rounded-2xl hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl mb-2 line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">{post.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <Button variant="outline" asChild className="w-full rounded-xl bg-transparent">
                  <Link href={`/blog/${post.slug}`}>Read More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2026 ApplyFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
