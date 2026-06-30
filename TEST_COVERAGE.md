# ResuVibe Test Coverage

Comprehensive test suite for the First-Time Job Seeker UX features.

## Test Files

### 1. `src/pages/Onboarding.test.tsx`
**Component unit tests for the 5-step onboarding wizard**

- ✅ Step 1: Name & Experience
  - Renders name, last name, and years of experience fields
  - Navigates to Step 2 on next click
  - Allows skipping onboarding

- ✅ Step 2: Resume Upload/Paste
  - Shows both "Upload Resume" and "Paste Resume Text" tabs
  - Defaults to "Paste Resume Text" tab
  - Allows switching between tabs
  - Allows pasting resume text
  - Shows "Don't have a resume yet?" link
  - Clicking link completes onboarding and navigates to `/build-my-resume`
  - Extracts skills and industries on step transition (resume >= 50 chars)

- ✅ Step 3: Skills & Industries
  - Renders Key Skills section
  - Renders Target Industries section
  - Allows selecting pre-extracted skills from resume
  - Allows adding custom skills
  - Allows selecting pre-extracted industries from resume
  - Allows adding custom industries
  - Shows "pre-selected" message when skills/industries extracted

- ✅ Step 4: Master Cover Letter Upload/Paste
  - Shows both "Upload Cover Letter" and "Paste Cover Letter" tabs
  - Defaults to "Paste Cover Letter" tab
  - Allows switching between tabs
  - Allows pasting cover letter text

- ✅ Step 5: Completion
  - Shows "You're all set!" message
  - Shows "Get Started" button
  - Completes onboarding on button click
  - Navigates to `/applications`

- ✅ Navigation
  - Back button navigates to previous step
  - Can navigate back through all steps
  - Step indicators allow jumping to completed steps

### 2. `src/pages/FirstTimeJobSeeker.test.tsx`
**Component tests for the first-time job seeker page**

- ✅ Renders main heading
- ✅ Renders subtitle
- ✅ Displays sparkles icon
- ✅ Renders workflow placeholder card
- ✅ Uses PageShell for layout

### 3. `src/lib/extractResumeSkills.test.ts`
**Edge function response validation and data processing tests**

- ✅ Response Validation
  - Validates successful responses with skills and industries
  - Validates successful responses with empty arrays
  - Validates error responses
  - Rejects responses with invalid types
  - Rejects responses missing required fields
  - Handles null/undefined responses

- ✅ Response Processing
  - Deduplicates skills
  - Deduplicates industries
  - Trims whitespace from skills and industries
  - Filters empty strings
  - Validates expected skill count (8-20)
  - Validates expected industry count (1-5)

- ✅ Edge Cases
  - Handles extremely long skill names
  - Handles mixed case industry names
  - Handles special characters in skills (C++, C#, Node.js, etc.)
  - Handles resume text rejection (too short)
  - Handles resume text at minimum threshold

- ✅ Integration Scenarios
  - Typical tech resume response
  - Typical healthcare resume response
  - Skill extraction failure handling

### 4. `src/test/integration.onboarding.test.tsx`
**Full end-to-end integration tests for onboarding workflows**

- ✅ Full Onboarding Flow: Resume Upload Path
  - Complete workflow with resume text and skills
  - Enters name, experience
  - Pastes resume content
  - Verifies skill and industry extraction
  - Adds custom skills
  - Adds cover letter
  - Completes onboarding and navigates to applications

- ✅ Full Onboarding Flow: First-Time Job Seeker Path
  - Completes onboarding without resume
  - Navigates to first-time job seeker page
  - Verifies profile was saved with basic info

- ✅ Data Validation
  - Requires minimum resume length for extraction
  - Allows skipping optional cover letter
  - Validates form inputs

- ✅ Multi-step Navigation
  - Preserves data when navigating back and forth
  - Allows jumping between steps using step indicators
  - Maintains state across navigation

- ✅ Error Handling
  - Handles skill extraction failure gracefully
  - Handles profile save failure
  - Continues onboarding despite extraction failures

### 5. `src/test/routing.test.tsx`
**App routing configuration tests**

- ✅ FirstTimeJobSeeker Route Configuration
  - Route `/build-my-resume` exists for authenticated users
  - Route is accessible after onboarding completion
  - Route displays correct component

- ✅ Onboarding Redirects
  - Redirects from `/onboarding` to `/applications` for onboarded users
  - Shows onboarding for users who haven't completed it

- ✅ Unauthenticated Routes
  - Allows access to landing page, login, signup, reset password
  - Redirects unknown routes to landing page

- ✅ Authenticated Routes
  - Allows access to applications, profile, admin, build-my-resume
  - Redirects `/` to `/applications` for authenticated users

- ✅ Route Protection
  - Protects authenticated routes from unauthenticated users
  - Allows `/build-my-resume` only for authenticated + onboarded users
  - Redirects to `/onboarding` if not onboarded

- ✅ Tab-based Routing in ApplicationDetail
  - Supports `/applications/:id/resume`
  - Supports `/applications/:id/cover-letter`
  - Supports `/applications/:id/jd-analysis`
  - Supports `/applications/:id/materials`
  - Supports `/applications/:id/details`

- ✅ Legal Routes
  - `/about`, `/privacy`, `/terms`, `/contact`, `/privacy-request`

- ✅ 404 Handling
  - Catches unknown routes and returns 404

## Test Statistics

| Category | Count |
|----------|-------|
| Component Tests | 2 files |
| Unit Tests | 1 file |
| Integration Tests | 2 files |
| Total Test Files | 5 |
| Total Test Cases | 80+ |

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test src/pages/Onboarding.test.tsx

# Run tests with coverage
npm run test:coverage
```

## Coverage Goals

- **Onboarding Component**: 90%+ coverage
- **FirstTimeJobSeeker Component**: 100% coverage
- **Edge Function Validation**: 100% coverage
- **Routing**: 100% coverage
- **Integration Workflows**: 95%+ coverage

## Features Covered

✅ **Resume Management**
- Upload PDF/DOC/DOCX files
- Paste resume text
- Extract skills from resume
- Extract industries from resume
- Display pre-selected skills/industries on Step 3

✅ **Cover Letter Management**
- Upload PDF/DOC/DOCX files
- Paste cover letter text
- Mark as optional

✅ **Skill Extraction**
- AI-powered skill extraction from resume
- Deduplication and trimming
- 8-20 skills per resume
- Custom skill addition

✅ **Industry Extraction**
- AI-powered industry extraction from resume
- 1-5 industries per resume
- Custom industry addition
- Intelligent selection based on resume content

✅ **First-Time Job Seeker Path**
- Skip resume upload/paste
- Quick onboarding completion
- Redirect to `/build-my-resume` workflow
- Profile creation with basic info

✅ **Onboarding Flow**
- 5-step wizard
- Progress visualization
- Back/forward navigation
- Step indicator navigation
- State preservation
- Error handling
- Profile save to database

✅ **Routing**
- Unauthenticated public routes
- Authenticated protected routes
- Onboarding conditional routing
- Tab-based URL routing for ApplicationDetail
- 404 handling
- Proper redirects

## Mocked Dependencies

- `supabase` - Database and edge function calls
- `@/hooks/useAuth` - Authentication state
- `sonner` - Toast notifications
- `react-router-dom` - Navigation
- `@tanstack/react-query` - Server state management

## Next Steps

1. Run full test suite: `npm run test`
2. Review test coverage report: `npm run test:coverage`
3. Add tests for file upload handling (currently mocked)
4. Add visual regression tests for Step 2 and Step 4 tabs
5. Add performance tests for skill/industry extraction
6. Add accessibility tests for onboarding wizard
