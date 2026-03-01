# ApplyFlow Testing Suite

This directory contains automated tests for the ApplyFlow application, with a focus on testing the resume optimization functionality powered by Google Gemini.

## Test Structure

\`\`\`
tests/
├── unit/                    # Unit tests (Vitest)
│   └── api/
│       └── optimize-resume.test.ts
├── e2e/                     # End-to-end tests
│   └── optimize-resume.test.js
├── data/                    # Test fixtures
│   ├── test-resume.docx
│   └── test-job-description.txt
└── README.md
\`\`\`

## Running Tests Locally

### Prerequisites

1. Set up environment variables in `.env.local`:
\`\`\`bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your_test_password
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

2. Create a test user account in your Supabase database with the credentials above
3. Ensure the test user has sufficient credits

### Run Unit Tests
\`\`\`bash
pnpm test
\`\`\`

### Run E2E Tests
\`\`\`bash
# Start the development server first
pnpm dev

# In another terminal:
pnpm test:e2e
\`\`\`

## CI/CD Integration

Tests automatically run on every successful deployment via GitHub Actions.

### Setup

1. Add the following secrets to your GitHub repository:
   - `TEST_USER_EMAIL`: Email of test user account
   - `TEST_USER_PASSWORD`: Password of test user account
   - `SITE_URL`: Your production URL (optional, will use deployment URL)
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Already configured

2. The workflow `.github/workflows/test-deployment.yml` will:
   - Trigger after each successful Vercel deployment
   - Run the E2E test suite
   - Report results in the Actions tab

## Test Data

### Test Resume (`tests/data/test-resume.docx`)
Upload your own sample resume in .docx format for testing.

### Test Job Description (`tests/data/test-job-description.txt`)
Contains a sample job posting for a Full-Stack Software Engineer position.

## What Gets Tested

1. **Authentication**: Verifies test user can authenticate
2. **API Integration**: Tests the `/api/optimize-resume` endpoint
3. **Gemini API**: Validates that Google Gemini responds correctly
4. **Response Structure**: Checks that the response includes:
   - Optimized resume data
   - Interview guide with questions
   - Proper metadata

## Troubleshooting

### Test User Has No Credits
If you see "no credits remaining" error, either:
- Add credits to the test user account in Supabase
- Grant Pro subscription to the test user

### Authentication Fails
- Verify TEST_USER_EMAIL and TEST_USER_PASSWORD are correct
- Check that the user exists in Supabase auth.users table
- Ensure user profile exists in user_profiles table

### Gemini API Errors
- Verify GOOGLE_GENERATIVE_AI_API_KEY is valid
- Check API quotas in Google Cloud Console
- Review model name is correct (gemini-2.5-flash)

## Adding New Tests

To add new test scenarios:

1. For unit tests: Add to `tests/unit/api/optimize-resume.test.ts`
2. For E2E tests: Extend `tests/e2e/optimize-resume.test.js`
3. Add new test data to `tests/data/` as needed
