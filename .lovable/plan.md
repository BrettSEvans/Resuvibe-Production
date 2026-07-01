## Why /applications isn't showing up

`src/App.tsx` currently:

- Signed-out at `/` → `LandingPage` (correct, keep as-is).
- Signed-in with `profiles.onboarding_completed_at` set → `/applications` (already correct).
- Signed-in with `onboarding_completed_at` **null** → forced to `/onboarding`, and every other path (including `/applications`) is redirected back to `/onboarding`.

So an existing signed-in user whose profile row happens to have `onboarding_completed_at = null` gets trapped, and a new user is sent to the old `Onboarding` page instead of the first-time resume builder you want.

## Fix

Change the "first-time user" branch in `AuthenticatedApp` (`src/App.tsx`) to route through `FirstTimeJobSeeker` instead of `Onboarding`:

- Signed-out at `/` → `LandingPage` (unchanged).
- Signed-in **with** `onboarding_completed_at` → `/applications` (unchanged; this is the "existing account" path).
- Signed-in **without** `onboarding_completed_at` → land on `/build-my-resume` rendered by `FirstTimeJobSeeker`, wrapped in `AppHeader` so navigation still works.
  - Also allow `/applications`, `/applications/:id`, `/profile`, `/stories`, `/build-my-cover-letter`, and the static pages while in the first-time state — so nothing gets trapped.
  - The catch-all in the first-time branch redirects to `/build-my-resume` (not `/onboarding`).

`FirstTimeJobSeeker` itself is responsible for marking `onboarding_completed_at` when the user finishes; once that flips, the existing `useProfileCheck` re-render moves the user into the main `/applications` flow automatically.

No database changes, no changes to signed-out behavior, no changes to the authenticated `/applications` routes.

## Verification

- Sign in as an existing user with a completed profile → lands on `/applications`, can navigate freely.
- Sign in as a brand-new user (or one with `onboarding_completed_at = null`) → lands on `/build-my-resume`; can still open `/applications` and `/profile` from the header without being bounced.
- Sign out → `/` shows the landing page.