# ResuVibe App - Complete Page Flow Guide

## Overview
This document outlines all page types in the ResuVibe application, their routes, access conditions, and user flows.

---

## 1. PUBLIC PAGES (No Authentication Required)

### Landing Page
- **Route:** `/`
- **Access:** Unauthenticated users only
- **Description:** Marketing homepage showcasing ResuVibe features, benefits, and CTAs
- **Key Elements:**
  - Hero section: "The Recruiter Has AI. Now You Do Too – For Free"
  - Feature showcase (AI Resume Tailoring, Custom Cover Letters, ATS Keyword Matching, etc.)
  - Statistics and benefits
  - Call-to-action buttons: "Build My Resume Free", "Get Started – It's Free"
- **Navigation:**
  - "See Example" → External link
  - "Get Started – It's Free" → `/signup`
  - "Build My Resume Free" → `/signup`

### Sign In
- **Route:** `/login`
- **Access:** Unauthenticated users only
- **Description:** Authentication form for existing users
- **Key Elements:**
  - "Continue with Google" OAuth button
  - Email/password login form
  - "Forgot password?" link → `/reset-password`
  - Sign In / Sign Up tabs
  - Terms of Service agreement
- **After Successful Login:**
  - Redirects to `/onboarding` if onboarding not completed
  - Redirects to `/applications` if onboarding completed

### Sign Up
- **Route:** `/signup`
- **Access:** Unauthenticated users only
- **Description:** Account creation form for new users
- **Key Elements:**
  - "Continue with Google" OAuth button
  - Email/password registration form
  - Password confirmation field
  - "Create Account" button
  - Sign In / Sign Up tabs
  - Terms of Service agreement
- **After Successful Registration:**
  - Redirects to `/onboarding`

### Reset Password
- **Route:** `/reset-password`
- **Access:** Unauthenticated users only
- **Description:** Password recovery page
- **Functionality:**
  - Email-based password reset link
  - New password form after clicking reset link

### About
- **Route:** `/about`
- **Access:** All users (authenticated or unauthenticated)
- **Description:** Company/product information page

### Privacy Policy
- **Route:** `/privacy`
- **Access:** All users (authenticated or unauthenticated)
- **Description:** Legal privacy policy document
- **Key Sections:**
  - Data controller information
  - Information collection methods
  - User rights and GDPR/CCPA compliance

### Terms of Service
- **Route:** `/terms`
- **Access:** All users (authenticated or unauthenticated)
- **Description:** Legal terms and conditions

### Contact
- **Route:** `/contact`
- **Access:** All users (authenticated or unauthenticated)
- **Description:** Contact/support page

### Privacy Request
- **Route:** `/privacy-request`
- **Access:** All users (authenticated or unauthenticated)
- **Description:** GDPR/CCPA/PIPEDA data subject request form

---

## 2. AUTHENTICATED PAGES (Requires Login)

### Onboarding
- **Route:** `/onboarding`
- **Access:** Authenticated users who haven't completed onboarding
- **Description:** First-time setup flow for new users
- **Redirect Behavior:**
  - Non-onboarded users trying to access app pages → Forced to `/onboarding`
  - Onboarded users trying to access `/onboarding` → Redirected to `/applications`

### Applications Dashboard
- **Route:** `/applications` OR `/` (when authenticated)
- **Access:** Authenticated users who completed onboarding
- **Description:** Main app dashboard showing user's job applications
- **Key Features:**
  - List of all user's job applications
  - Quick stats/summary
  - Action buttons to create new application

### New Application
- **Route:** `/applications/new`
- **Access:** Authenticated users who completed onboarding
- **Description:** Form to create/add a new job application
- **User Flow:**
  1. Enter job details (job title, company, job description)
  2. Paste job listing
  3. System generates AI-tailored resume and cover letter
  4. Review and save application

### Application Detail
- **Routes:** 
  - `/applications/:id` - Default view
  - `/applications/:id/:tab` - Specific tab (resume, cover letter, etc.)
- **Access:** Authenticated users who completed onboarding
- **Description:** Detailed view of a single job application
- **Tabs/Views:**
  - Generated Resume
  - Generated Cover Letter
  - Application Notes
  - Job Listing Details
  - Action buttons (Edit, Delete, Export, Download, etc.)

### Profile
- **Route:** `/profile`
- **Access:** Authenticated users who completed onboarding
- **Description:** User account settings and profile management
- **Features:**
  - Personal information
  - Account settings
  - Resume upload/management
  - Preferences
  - Account security

### Templates
- **Route:** `/templates`
- **Access:** Authenticated users who completed onboarding
- **Description:** Resume and cover letter templates library

### Storyboard
- **Route:** `/stories`
- **Access:** Authenticated users who completed onboarding
- **Description:** Story/narrative builder for cover letters (shows career narrative)

### Admin
- **Route:** `/admin`
- **Access:** Admin users only
- **Description:** Administrative dashboard (if user has admin role)

### Build My Resume
- **Route:** `/build-my-resume`
- **Access:** Authenticated users
- **Description:** Standalone resume builder/editor tool
- **Features:**
  - Resume template selection
  - Section editing (work history, education, skills, etc.)
  - AI-powered suggestions
  - Export/download options

### Build My Cover Letter
- **Route:** `/build-my-cover-letter`
- **Access:** Authenticated users
- **Description:** Standalone cover letter builder/editor
- **Features:**
  - Cover letter templates
  - AI-powered writing suggestions
  - Job-specific customization
  - Export/download options

---

## 3. SPECIAL/CONDITIONAL PAGES

### Application Session Result
- **Route:** `/applications/session`
- **Access:** Authenticated users who completed onboarding
- **Description:** Results page after AI generation session
- **Context:** Shown after user completes job matching flow

### Demo Application
- **Route:** `/applications/demo`
- **Access:** Authenticated users who completed onboarding
- **Description:** Demo/example application for UX/tutorial purposes
- **Purpose:** Help new users understand application feature

---

## 4. NOT FOUND (Error Page)
- **Route:** Any invalid route when authenticated
- **Access:** Authenticated users
- **Description:** 404 error page
- **Behavior:** Shows when user navigates to non-existent route

---

## USER FLOW CONDITIONS

### New User Flow
1. Visit `/` (Landing Page)
2. Click "Get Started – It's Free" or "Build My Resume Free"
3. Redirected to `/signup` (Sign Up form)
4. Create account with email/password or Google OAuth
5. Redirected to `/onboarding` (Onboarding flow)
6. Complete onboarding setup
7. Redirected to `/applications` (Main dashboard)
8. Create first application at `/applications/new`

### Returning User Flow
1. Visit `/` (Landing Page)
2. Click "See Example" or see login prompt
3. Redirected to `/login` (Sign In form)
4. Authenticate with email/password or Google OAuth
5. If onboarding completed → Redirected to `/applications`
6. If onboarding not completed → Redirected to `/onboarding`

### Authenticated User Default Routes
- Accessing `/` → Redirects to `/applications` (Main dashboard)
- Accessing `/login` → Redirects to `/applications`
- Accessing `/signup` → Redirects to `/applications`
- Accessing non-existent route → Shows 404 page

### Unauthenticated User Default Routes
- Accessing protected routes (e.g., `/applications`) → Redirects to `/` (Landing page)
- Accessing `/onboarding` → Redirects to `/` (Landing page)
- Accessing `/admin` → Redirects to `/` (Landing page)

---

## ROUTING STRUCTURE DIAGRAM

```
Landing Page (/)
├── Unauthenticated
│   ├── Sign In (/login)
│   ├── Sign Up (/signup)
│   │   └── Forgot Password (/reset-password)
│   └── Info Pages
│       ├── About (/about)
│       ├── Privacy (/privacy)
│       ├── Terms (/terms)
│       ├── Contact (/contact)
│       └── Privacy Request (/privacy-request)
│
└── Authenticated
    ├── Onboarding Not Completed
    │   ├── Onboarding (/onboarding)
    │   └── Stories (/stories) - Part of onboarding
    │
    └── Onboarding Completed
        ├── Applications (/applications or /)
        │   ├── New Application (/applications/new)
        │   ├── Application Detail (/applications/:id)
        │   ├── Session Results (/applications/session)
        │   └── Demo Application (/applications/demo)
        │
        ├── Profile (/profile)
        ├── Templates (/templates)
        ├── Build My Resume (/build-my-resume)
        ├── Build My Cover Letter (/build-my-cover-letter)
        └── Admin (/admin) - Admin only
```

---

## AUTHENTICATION STATE ROUTING LOGIC

### Current Routing (Commit f75b278 - Matches 5b83af5)

```typescript
// Unauthenticated users (no session)
/ → LandingPage
/login → Login (Sign In tab)
/signup → Login (Sign Up tab)
/reset-password → ResetPassword
/about, /privacy, /terms, /contact, /privacy-request → Info pages
/* → Redirect to /

// Onboarding not completed
/ → LandingPage
/onboarding → Onboarding
/stories → StoryBoard
/* → Redirect to /onboarding

// Onboarding completed (fully authenticated)
/ → Applications (main dashboard)
/applications → Applications
/applications/new → NewApplication
/applications/:id → ApplicationDetail
/profile → Profile
/templates → Templates
/build-my-resume → FirstTimeJobSeeker
/build-my-cover-letter → BuildMyCoverLetter
/login, /signup → Redirect to /applications
```

---

## KEY USER FLOW DECISIONS

1. **Home Route (`/`):**
   - Unauthenticated → Shows marketing landing page
   - Authenticated → Directly shows application dashboard
   - Different experiences based on auth state

2. **Login/Signup Routes:**
   - Only accessible to unauthenticated users
   - Authenticated users trying to access → Redirected to `/applications`

3. **Onboarding Gate:**
   - Onboarding is mandatory before accessing main app features
   - Can't skip to `/applications` without completing onboarding
   - `/onboarding` is the initial destination after signup

4. **Public Info Pages:**
   - Accessible to both authenticated and unauthenticated users
   - Allows users to read privacy policy, terms, etc. anytime

5. **Admin Pages:**
   - Only accessible to users with admin role
   - Non-admin users hitting `/admin` → Redirected to `/applications`

---

## SUMMARY TABLE

| Page | Route | Auth Required | Onboarding Required | Description |
|------|-------|---|---|---|
| Landing | `/` | No | N/A | Marketing homepage |
| Sign In | `/login` | No | N/A | Login form |
| Sign Up | `/signup` | No | N/A | Registration form |
| Reset Password | `/reset-password` | No | N/A | Password recovery |
| Onboarding | `/onboarding` | Yes | No | First-time setup |
| Applications | `/applications` or `/` | Yes | Yes | Main dashboard |
| New App | `/applications/new` | Yes | Yes | Create application |
| App Detail | `/applications/:id` | Yes | Yes | Application details |
| Profile | `/profile` | Yes | Yes | User settings |
| Templates | `/templates` | Yes | Yes | Template library |
| Build Resume | `/build-my-resume` | Yes | Yes | Resume builder |
| Build Letter | `/build-my-cover-letter` | Yes | Yes | Cover letter builder |
| Admin | `/admin` | Yes (Admin) | Yes | Admin dashboard |
| About | `/about` | No | N/A | Company info |
| Privacy | `/privacy` | No | N/A | Privacy policy |
| Terms | `/terms` | No | N/A | Terms of service |
| Contact | `/contact` | No | N/A | Contact page |

