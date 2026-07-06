# ResuVibe User Flow Diagram

## Complete User Journey Flow

```mermaid
graph TD
    START([User Visits App]) --> CHECK{Authenticated?}
    
    CHECK -->|No| LANDING["Landing Page<br/>Route: /"]
    CHECK -->|Yes| ONBOARD_CHECK{Onboarding<br/>Completed?}
    
    LANDING --> LANDING_ACTIONS["CTAs:<br/>1. Get Started → /signup<br/>2. Build My Resume → /signup<br/>3. See Example<br/>4. Info Links: About, Privacy, etc."]
    
    LANDING_ACTIONS --> AUTH_CHOICE{User Action}
    AUTH_CHOICE -->|New User| SIGNUP["Sign Up Page<br/>Route: /signup<br/>Create Account"]
    AUTH_CHOICE -->|Existing User| LOGIN["Sign In Page<br/>Route: /login<br/>Email/Password or OAuth"]
    AUTH_CHOICE -->|Info| INFO["Info Pages<br/>Routes: /about<br/>/privacy, /terms<br/>/contact"]
    
    INFO --> LANDING
    
    SIGNUP --> SIGNUP_SUBMIT["User submits signup<br/>Email + Password<br/>Create Account"]
    SIGNUP_SUBMIT --> ONBOARD["Onboarding Flow<br/>Route: /onboarding<br/>Setup Profile & Resume"]
    
    LOGIN --> LOGIN_SUBMIT["User submits login<br/>Email/Password or OAuth<br/>Session Created"]
    LOGIN_SUBMIT --> ONBOARD_CHECK
    
    ONBOARD_CHECK -->|Not Completed| ONBOARD
    ONBOARD --> ONBOARDING_STEPS["Step 1: Personal Info<br/>Step 2: Upload Resume<br/>Step 3: Career Details<br/>Step 4: Preferences"]
    ONBOARDING_STEPS --> ONBOARDING_COMPLETE["Onboarding Complete<br/>Session Updated"]
    
    ONBOARD_CHECK -->|Completed| MAIN_APP["Main App<br/>Route: / or /applications"]
    ONBOARDING_COMPLETE --> MAIN_APP
    
    MAIN_APP --> APP_ACTIONS["Main Dashboard<br/>Applications List<br/>Recent Activity"]
    
    APP_ACTIONS --> USER_CHOICE{User Action}
    
    USER_CHOICE -->|Create New| NEW_APP["New Application<br/>Route: /applications/new<br/>1. Job Details Form<br/>2. Paste Job Listing<br/>3. AI Generation<br/>4. Review & Save"]
    
    USER_CHOICE -->|View Existing| APP_DETAIL["Application Detail<br/>Route: /applications/:id<br/>Tabs: Resume | Letter<br/>Edit | Delete | Export"]
    
    USER_CHOICE -->|Build Tools| BUILD["Build Tools<br/>Routes:<br/>- /build-my-resume<br/>- /build-my-cover-letter<br/>Template Selection & Editor"]
    
    USER_CHOICE -->|Profile| PROFILE["Profile Page<br/>Route: /profile<br/>Settings | Security"]
    
    USER_CHOICE -->|Templates| TEMPLATES["Templates<br/>Route: /templates<br/>Browse Resume & Letter<br/>Templates"]
    
    USER_CHOICE -->|Sign Out| LOGOUT["Sign Out<br/>Session Cleared<br/>Return to Landing Page"]
    
    NEW_APP --> NEW_APP_FLOW["1. Enter Job Details<br/>2. Review AI Output<br/>3. Save Application<br/>4. Return to Dashboard"]
    NEW_APP_FLOW --> MAIN_APP
    
    APP_DETAIL --> DETAIL_ACTIONS["View Resume<br/>View Cover Letter<br/>Edit Application<br/>Download/Export<br/>Delete<br/>Back to Dashboard"]
    DETAIL_ACTIONS --> MAIN_APP
    
    BUILD --> BUILD_EDITOR["Template Selection<br/>Edit Content<br/>AI Suggestions<br/>Export/Download"]
    BUILD_EDITOR --> MAIN_APP
    
    PROFILE --> PROFILE_EDIT["Update Settings<br/>Manage Account<br/>Security Options<br/>Back to Dashboard"]
    PROFILE_EDIT --> MAIN_APP
    
    TEMPLATES --> TEMPLATES_VIEW["Browse Templates<br/>Preview<br/>Select for Use<br/>Back to Dashboard"]
    TEMPLATES_VIEW --> MAIN_APP
    
    LOGOUT --> LANDING
    
    style START fill:#4CAF50
    style LANDING fill:#2196F3
    style SIGNUP fill:#FF9800
    style LOGIN fill:#FF9800
    style ONBOARD fill:#9C27B0
    style MAIN_APP fill:#4CAF50
    style INFO fill:#2196F3
    style LOGOUT fill:#f44336
```

---

## Authentication State Flow

```mermaid
graph LR
    A["User Visits App"] --> B{Has Valid<br/>Session?}
    
    B -->|NO| C["Unauthenticated State"]
    B -->|YES| D["Authenticated State"]
    
    C --> C1["Routes Available:<br/>/ Landing Page<br/>/login Sign In<br/>/signup Sign Up<br/>/about About<br/>/privacy Privacy<br/>/terms Terms<br/>/contact Contact<br/>/reset-password Reset"]
    
    C1 --> C2{User Action}
    C2 -->|Sign Up| C3["Create Account<br/>→ Onboarding"]
    C2 -->|Sign In| C4["Authenticate<br/>→ Check Onboarding"]
    
    D --> D1{Onboarding<br/>Completed?}
    
    D1 -->|NO| D2["Onboarding State<br/>Routes:<br/>/ → Landing<br/>/onboarding → Onboarding<br/>/stories → Stories<br/>/* → Redirect /onboarding"]
    
    D1 -->|YES| D3["Full App State<br/>Routes:<br/>/ → Applications Dashboard<br/>/applications → App List<br/>/applications/new → Create<br/>/profile → Profile<br/>/templates → Templates<br/>/build-my-resume<br/>/build-my-cover-letter<br/>/admin → Admin Panel"]
    
    D2 --> D2_ACTION["Complete Onboarding"] --> D3
    
    D3 --> D4["User Can Perform<br/>All App Actions"]
    
    C3 --> D
    C4 --> D
    
    style A fill:#4CAF50
    style C fill:#FF9800
    style D fill:#2196F3
    style D3 fill:#4CAF50
```

---

## Detailed New User Signup Flow

```mermaid
sequenceDiagram
    participant User
    participant Landing as Landing Page
    participant Signup as Sign Up Page
    participant Auth as Auth Service
    participant Onboard as Onboarding
    participant App as Main App
    
    User->>Landing: Visits / (Landing Page)
    User->>Landing: Clicks "Get Started Free"
    Landing->>Signup: Redirects to /signup
    
    User->>Signup: Enters Email
    User->>Signup: Enters Password
    User->>Signup: Confirms Password
    User->>Signup: Clicks "Create Account"
    
    Signup->>Auth: Submit Registration
    Auth->>Auth: Create User Account
    Auth->>Auth: Create Session
    Auth->>Onboard: Redirect to /onboarding
    
    User->>Onboard: Onboarding Step 1 - Personal Info
    User->>Onboard: Enter First/Last Name
    User->>Onboard: Save & Continue
    
    User->>Onboard: Onboarding Step 2 - Resume Upload
    User->>Onboard: Upload Resume File
    User->>Onboard: System Parses Resume
    User->>Onboard: Save & Continue
    
    User->>Onboard: Onboarding Step 3 - Career Details
    User->>Onboard: Enter Experience Level
    User->>Onboard: Enter Key Skills
    User->>Onboard: Select Target Industries
    User->>Onboard: Save & Continue
    
    User->>Onboard: Onboarding Step 4 - Preferences
    User->>Onboard: Set Job Preferences
    User->>Onboard: Set Communication Prefs
    User->>Onboard: Complete Onboarding
    
    Onboard->>App: Mark Onboarding Complete
    Onboard->>App: Redirect to /applications
    
    User->>App: View Applications Dashboard
    User->>App: Create First Job Application
```

---

## Route Access Matrix

```mermaid
graph TB
    subgraph "UNAUTHENTICATED (No Login)"
        U1["✅ / Landing Page"]
        U2["✅ /login Sign In"]
        U3["✅ /signup Sign Up"]
        U4["✅ /reset-password Reset"]
        U5["✅ /about About"]
        U6["✅ /privacy Privacy"]
        U7["✅ /terms Terms"]
        U8["✅ /contact Contact"]
        U9["✅ /privacy-request Privacy Request"]
        U10["❌ /applications Redirects to /"]
        U11["❌ /onboarding Redirects to /"]
        U12["❌ /profile Redirects to /"]
    end
    
    subgraph "AUTHENTICATED - ONBOARDING NOT COMPLETE"
        A1["✅ / Redirects to Landing"]
        A2["✅ /onboarding Onboarding Flow"]
        A3["✅ /stories Stories/Narrative"]
        A4["❌ /applications Redirects to /onboarding"]
        A5["❌ /profile Redirects to /onboarding"]
        A6["❌ /templates Redirects to /onboarding"]
    end
    
    subgraph "AUTHENTICATED - ONBOARDING COMPLETE"
        F1["✅ / Applications Dashboard"]
        F2["✅ /applications Applications List"]
        F3["✅ /applications/new Create New"]
        F4["✅ /applications/:id Application Detail"]
        F5["✅ /profile User Profile"]
        F6["✅ /templates Templates Library"]
        F7["✅ /build-my-resume Resume Builder"]
        F8["✅ /build-my-cover-letter Letter Builder"]
        F9["✅ /stories Storyboard"]
        F10["✅ /admin Admin Panel (Admin only)"]
        F11["❌ /login Redirects to /applications"]
        F12["❌ /signup Redirects to /applications"]
    end
    
    style U1 fill:#90EE90
    style U2 fill:#90EE90
    style U3 fill:#90EE90
    style U10 fill:#FFB6C6
    style A2 fill:#90EE90
    style A3 fill:#90EE90
    style A4 fill:#FFB6C6
    style F1 fill:#90EE90
    style F2 fill:#90EE90
    style F3 fill:#90EE90
    style F11 fill:#FFB6C6
```

---

## Conditional Routing Logic Tree

```mermaid
graph TD
    A["User Makes Request<br/>to Route"] --> B{"Is User<br/>Authenticated?"}
    
    B -->|NO| C{"Is Route<br/>Public?"}
    B -->|YES| D{"Is Onboarding<br/>Complete?"}
    
    C -->|YES| E["✅ Allow Access<br/>Routes: /, /login, /signup,<br/>/about, /privacy, /terms,<br/>/contact, /reset-password"]
    C -->|NO| F["❌ Redirect to /"]
    
    D -->|NO| G{"Is Route<br/>Onboarding?"}
    D -->|YES| H["✅ Allow Access<br/>Full App Available"]
    
    G -->|YES| I["✅ Allow Access<br/>Routes: /onboarding,<br/>/stories, /"]
    G -->|NO| J["❌ Redirect to /onboarding"]
    
    style E fill:#90EE90
    style H fill:#90EE90
    style I fill:#90EE90
    style F fill:#FFB6C6
    style J fill:#FFB6C6
```

---

## Page Type Distribution

```mermaid
pie title ResuVibe Page Types by Category
    "Public Pages (No Auth)" : 6
    "Auth Required (Onboarding)" : 2
    "Auth + Onboarding Required" : 11
    "Admin Only" : 1
```

---

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Landing: App Load
    
    Landing --> SignUp: Click "Get Started"
    Landing --> SignIn: Click "Sign In"
    Landing --> Public: Click Info Links
    
    Public --> Landing: Navigate Back
    
    SignUp --> CreateAccount: Fill Form
    CreateAccount --> Onboarding: Account Created
    
    SignIn --> Authenticate: Submit Credentials
    Authenticate --> Onboarding: Check Onboarding
    Authenticate --> MainApp: Resume Session
    
    Onboarding --> OnboardStep1: Personal Info
    OnboardStep1 --> OnboardStep2: Next
    OnboardStep2 --> OnboardStep3: Next
    OnboardStep3 --> OnboardStep4: Next
    OnboardStep4 --> MainApp: Complete Onboarding
    
    MainApp --> CreateApp: New Application
    CreateApp --> AppDetail: Save
    AppDetail --> MainApp: Return
    
    MainApp --> Profile: View Profile
    Profile --> MainApp: Return
    
    MainApp --> Templates: View Templates
    Templates --> MainApp: Return
    
    MainApp --> BuildTools: Use Builders
    BuildTools --> MainApp: Export
    
    MainApp --> SignOut: Sign Out
    SignOut --> Landing: Return
    
    Landing --> [*]: Close App
```
