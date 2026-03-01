import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, HelpCircle } from "lucide-react"
import { sanitizeContent } from "@/lib/sanitize"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | ApplyFlow",
  description:
    "Get answers to common questions about ApplyFlow, ATS optimization, resume formatting, and job application strategies. Learn how our AI-powered platform helps you land more interviews.",
  keywords: [
    "ApplyFlow FAQ",
    "ATS optimization questions",
    "resume formatting help",
    "job application questions",
    "applicant tracking system",
  ],
}

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: sanitizeContent("What is ApplyFlow and how does it work?"),
        a: sanitizeContent(
          "ApplyFlow is an AI-powered resume optimization platform that tailors your resume to match specific job postings. Simply upload your resume, paste a job description, and our advanced AI analyzes both to create an optimized version that highlights the most relevant skills and experiences. The platform also generates personalized interview guides to help you prepare for the role.",
        ),
      },
      {
        q: sanitizeContent("Do I need to create an account to use ApplyFlow?"),
        a: sanitizeContent(
          "Yes, creating a free account allows you to access 3 free resume optimizations, save your optimization history, and track your applications. Signing up takes less than a minute with just your email address.",
        ),
      },
      {
        q: sanitizeContent("What file formats does ApplyFlow accept?"),
        a: sanitizeContent(
          "ApplyFlow currently accepts DOCX (Microsoft Word) format for resume uploads. This format preserves formatting and allows our AI to accurately parse your information. We recommend using a clean, well-formatted DOCX file for best results.",
        ),
      },
    ],
  },
  {
    category: "ATS & Resume Optimization",
    questions: [
      {
        q: sanitizeContent("What is an ATS (Applicant Tracking System) and why does it matter?"),
        a: sanitizeContent(
          "An Applicant Tracking System (ATS) is software used by 98% of Fortune 500 companies and 66% of all employers to screen resumes before they reach human recruiters. ATS software scans resumes for keywords, skills, and qualifications that match the job description. If your resume doesn't contain the right keywords or is poorly formatted, it may be automatically rejected before a person ever sees it. ApplyFlow ensures your resume is ATS-friendly by optimizing keyword placement, formatting, and content structure.",
        ),
      },
      {
        q: sanitizeContent("How does ApplyFlow optimize my resume for ATS systems?"),
        a: sanitizeContent(
          "ApplyFlow uses advanced AI to analyze job descriptions and identify critical keywords, required skills, and preferred qualifications. It then strategically incorporates these elements into your resume while maintaining natural language and authenticity. Our system also ensures proper formatting, uses ATS-friendly section headers, and structures content in a way that ATS software can easily parse. This dramatically increases your chances of passing the initial ATS screening.",
        ),
      },
      {
        q: sanitizeContent("Will the optimized resume sound authentic or will it be obvious that AI wrote it?"),
        a: sanitizeContent(
          "ApplyFlow maintains your authentic voice and professional tone while strategically enhancing keyword density and relevance. The AI doesn't fabricate experience or skills—it reframes your existing qualifications to better align with what employers are seeking. The result is a polished, professional resume that sounds like you, just more targeted and effective.",
        ),
      },
      {
        q: sanitizeContent("Can I use the same optimized resume for multiple job applications?"),
        a: sanitizeContent(
          "While you can reuse optimized resumes for similar roles, we strongly recommend creating a new optimized version for each unique job posting. Different companies prioritize different skills and use different terminology, even for similar positions. ApplyFlow makes it easy to generate multiple tailored resumes quickly, significantly increasing your interview callback rate for each application.",
        ),
      },
    ],
  },
  {
    category: "Pricing & Credits",
    questions: [
      {
        q: sanitizeContent("How do credits work?"),
        a: sanitizeContent(
          "Each resume optimization requires 1 credit. Free accounts start with 3 credits, allowing you to test the platform. You can purchase additional credits in packs of 1, 10, or 25, or upgrade to Pro for unlimited optimizations. Credits never expire and can be used whenever you need them.",
        ),
      },
      {
        q: sanitizeContent("What's the difference between purchasing credits and Pro subscription?"),
        a: sanitizeContent(
          "Credit packs are ideal for occasional job searchers—you pay only for what you use, and credits never expire. Pro subscriptions ($29.99/month or $99.99 lifetime) offer unlimited optimizations, priority processing, advanced features, and premium support. If you're actively job searching and applying to multiple positions, Pro provides the best value.",
        ),
      },
      {
        q: sanitizeContent("Do unused credits expire?"),
        a: sanitizeContent(
          "No, purchased credits never expire. You can use them at your own pace, whether that's all at once or spread over months or years. Your credits remain available in your account indefinitely.",
        ),
      },
      {
        q: sanitizeContent("Can I get a refund if I'm not satisfied?"),
        a: sanitizeContent(
          "We offer a 7-day money-back guarantee on Pro subscriptions. If you're not completely satisfied with ApplyFlow within the first week of your subscription, contact our support team for a full refund. Credit purchases are non-refundable once used, but unused credits remain in your account.",
        ),
      },
    ],
  },
  {
    category: "Resume Best Practices",
    questions: [
      {
        q: sanitizeContent("What makes a resume ATS-friendly?"),
        a: sanitizeContent(
          "ATS-friendly resumes use standard section headings (Experience, Education, Skills), simple formatting without tables or graphics, common fonts (Arial, Calibri, Times New Roman), and strategic keyword placement. They avoid headers/footers, use standard bullet points, and include relevant keywords from the job description. ApplyFlow automatically ensures all these best practices are followed.",
        ),
      },
      {
        q: sanitizeContent("Should I include keywords exactly as they appear in the job description?"),
        a: sanitizeContent(
          "Yes, when appropriate. ATS systems often look for exact keyword matches, so using the same terminology as the job posting is crucial. However, this must be done naturally and authentically. ApplyFlow intelligently incorporates exact-match keywords while maintaining readability and professional tone, ensuring you don't sound robotic or inauthentic.",
        ),
      },
      {
        q: sanitizeContent("How long should my resume be?"),
        a: sanitizeContent(
          "For most professionals with less than 10 years of experience, one page is ideal. Those with 10+ years or extensive relevant experience can extend to two pages. Never sacrifice readability or important information to fit arbitrary length rules. ApplyFlow helps you prioritize the most relevant content for each specific job, ensuring you make the strongest impression within appropriate length constraints.",
        ),
      },
      {
        q: sanitizeContent("Should I include a summary or objective statement?"),
        a: sanitizeContent(
          "Modern resumes benefit from a strong professional summary (not an objective) that highlights your key qualifications and value proposition. The summary should be 2-4 sentences that immediately demonstrate why you're an excellent fit for the role. ApplyFlow generates tailored summaries for each job posting, ensuring your resume makes a strong first impression.",
        ),
      },
    ],
  },
  {
    category: "Job Application Strategy",
    questions: [
      {
        q: sanitizeContent("How many jobs should I apply to each week?"),
        a: sanitizeContent(
          "Quality matters more than quantity. Rather than mass-applying to 50+ jobs with a generic resume, focus on 10-15 highly relevant positions with tailored resumes. ApplyFlow makes it easy to create customized resumes quickly, allowing you to maintain quality while applying to multiple opportunities efficiently.",
        ),
      },
      {
        q: sanitizeContent("When is the best time to apply for a job?"),
        a: sanitizeContent(
          "Research shows applications submitted on Tuesday mornings between 6-10 AM (in the company's timezone) have the highest response rates. However, applying early in the posting period (within the first 24-48 hours) is more important than the time of day. With ApplyFlow, you can generate optimized resumes quickly, allowing you to apply promptly when you discover new opportunities.",
        ),
      },
      {
        q: sanitizeContent("Should I follow up after applying?"),
        a: sanitizeContent(
          "Yes, but strategically. Wait 1-2 weeks after applying before following up. Use LinkedIn to connect with the hiring manager or recruiter, mentioning your application and enthusiasm for the role. Keep follow-ups brief, professional, and value-focused. ApplyFlow's interview guides include company research and talking points that can strengthen your follow-up communications.",
        ),
      },
    ],
  },
  {
    category: "Technical & Privacy",
    questions: [
      {
        q: sanitizeContent("Is my resume data secure?"),
        a: sanitizeContent(
          "Absolutely. ApplyFlow uses enterprise-grade encryption for all data transmission and storage. We never share, sell, or use your personal information for any purpose other than providing our services. Your resumes and personal data are stored securely and are accessible only to you. We comply with GDPR, CCPA, and other major data protection regulations.",
        ),
      },
      {
        q: sanitizeContent("Can I delete my account and data?"),
        a: sanitizeContent(
          "Yes, you can delete your account and all associated data at any time from your account settings. Upon deletion, all your resumes, optimization history, and personal information are permanently removed from our systems within 30 days.",
        ),
      },
      {
        q: sanitizeContent("Does ApplyFlow work on mobile devices?"),
        a: sanitizeContent(
          "Yes! ApplyFlow is fully responsive and works seamlessly on smartphones and tablets. You can upload resumes, generate optimizations, and download results from any device. However, for the best experience when editing or reviewing detailed content, we recommend using a desktop or laptop.",
        ),
      },
    ],
  },
]

export default function FAQPage() {
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
            <Link href="/blog">Blog</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-xl">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to common questions about ApplyFlow, ATS optimization, and job application strategies.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {faqs.map((category, idx) => (
            <Card key={idx} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="rounded-3xl bg-primary/5 border-primary/20 max-w-3xl mx-auto">
          <CardContent className="py-12 px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground text-lg mb-6">Our team is here to help. Reach out anytime.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="rounded-xl">
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl bg-transparent">
                <Link href="/auth/sign-up">Start Free Trial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
