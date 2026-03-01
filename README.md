# ApplyFlow -- AI Resume Optimization Platform

ApplyFlow helps job seekers tailor their resumes to specific job descriptions using AI. Upload a resume and a job posting, and ApplyFlow generates an optimized resume, match scoring, and an interview preparation guide.

## Features

- **AI Resume Optimization** -- Upload your resume and a job description; get a tailored resume ranked by ATS compatibility
- **Match Scoring** -- See how well your resume matches the target role before and after optimization
- **Interview Guide Generation** -- Auto-generated interview prep based on the job description and your background
- **Credit System** -- Free tier with 3 optimizations; Pro tier via Stripe subscription
- **PDF Export** -- Download optimized resumes and interview guides as PDFs
- **Authentication** -- Email/password and OAuth sign-in via Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth & Database | Supabase (Auth + PostgreSQL) |
| AI | Google Gemini (2.5 Flash / 2.5 Pro) |
| Payments | Stripe (subscriptions + webhooks) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Document Parsing | Mammoth (DOCX), docxtemplater, PizZip |
| PDF Generation | jsPDF |
| Deployment | Vercel |
| Analytics | Vercel Analytics |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=https://localhost:3000

# Optional: Google Ads conversion tracking
NEXT_PUBLIC_GOOGLE_ADS_ID=
```

### Install & Run

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

### Build

```bash
pnpm build
pnpm start
```

## Architecture Overview

```
app/                  # Next.js App Router pages and API routes
  api/                # Server-side API endpoints
    optimize-resume/  # Core optimization endpoint (Gemini)
    webhooks/stripe/  # Stripe webhook handler
  auth/               # Login, sign-up, callback pages
  contact/            # Contact page
  dashboard/          # User dashboard (resume history)
  pricing/            # Pricing / subscription page
components/           # React components (shadcn/ui based)
lib/                  # Shared utilities
  supabase/           # Supabase client helpers (server + browser)
  analytics.ts        # Google Ads conversion tracking
  stripe.ts           # Stripe client setup
  utils.ts            # General utilities
tests/                # Test suites
  data/               # Synthetic test fixtures (resumes, job descriptions)
  e2e/                # End-to-end tests
```

### Request Flow

1. User uploads a `.docx` resume and pastes a job description
2. Client sends a multipart POST to `/api/optimize-resume`
3. Server parses the DOCX, calls Gemini with a structured prompt
4. Gemini returns optimized content + match scores + interview prep
5. Server generates PDFs and returns them as base64
6. Client renders results with before/after comparison

## Testing

```bash
# Unit / integration tests
pnpm vitest

# E2E (requires running server + env vars)
node tests/e2e/optimize-resume.test.js
```

## License

MIT
