import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Applications from "./pages/Applications";
import NewApplication from "./pages/NewApplication";
import ApplicationDetail from "./pages/ApplicationDetail";

import Templates from "./pages/Templates";
import StoryBoard from "./pages/StoryBoard";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import PrivacyRequest from "./pages/PrivacyRequest";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import BackgroundJobsBanner from "./components/BackgroundJobsBanner";
import AppHeader from "./components/AppHeader";
import AiChat from "./components/AiChat";
import { HelpDrawer } from "./components/HelpDrawer";
import { TutorialTour, useTourState } from "./components/TutorialTour";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/useTheme";
import { AdBanner } from "./components/ads/AdBanner";
import { AdDebugIndicator } from "./components/ads/AdDebugIndicator";
import { CookieConsent } from "./components/CookieConsent";
import { isSingleUserWorkflowEnabled } from "@/lib/featureFlags";
import SingleUserHeader from "@/pages/single-user/SingleUserHeader";
import SingleUserNewApplication from "@/pages/single-user/SingleUserNewApplication";
import SingleUserSessionResult from "@/pages/single-user/SingleUserSessionResult";
import SingleUserDemoApplication from "@/pages/single-user/SingleUserDemoApplication";

const queryClient = new QueryClient();

function SingleUserAppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SingleUserHeader />
      {children}
    </>
  );
}

function SingleUserApp() {
  useTheme();

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/applications" element={<Navigate to="/applications/new" replace />} />
        <Route path="/applications/new" element={<SingleUserAppShell><SingleUserNewApplication /></SingleUserAppShell>} />
        <Route path="/applications/session" element={<SingleUserAppShell><SingleUserSessionResult /></SingleUserAppShell>} />
        <Route path="/applications/demo" element={<SingleUserAppShell><SingleUserDemoApplication /></SingleUserAppShell>} />
        <Route path="/applications/:id" element={<SingleUserAppShell><ApplicationDetail /></SingleUserAppShell>} />
        <Route path="/applications/:id/:tab" element={<SingleUserAppShell><ApplicationDetail /></SingleUserAppShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      <CookieConsent />
      <AdDebugIndicator />
    </>
  );
}

function useProfileCheck(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile_check", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", userId!)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });
}

function AuthenticatedApp() {
  const { user, loading, signOut } = useAuth();
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const { data: profile, isLoading: profileLoading } = useProfileCheck(user?.id);
  const location = useLocation();
  const tour = useTourState();

  useInactivityLogout();
  useTheme();

  if (loading || (user && profileLoading)) {
    return <div className="flex items-center justify-center h-screen"><Skeleton className="w-64 h-8" /></div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login defaultTab="login" />} />
        <Route path="/signup" element={<Login defaultTab="signup" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy-request" element={<PrivacyRequest />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        {/* Any other path sends unauthenticated visitors to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!profile?.onboarding_completed_at) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/stories" element={<StoryBoard />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <BackgroundJobsBanner />
      <AppHeader aiChatOpen={aiChatOpen} onAiChatToggle={() => setAiChatOpen((o) => !o)} />

      {/* Leaderboard ad — desktop only, below header */}
      <div className="hidden md:flex w-full justify-center border-b border-border/40 bg-muted/20 py-1.5">
        <AdBanner size="leaderboard" key={location.pathname} />
      </div>
      {/* Mobile banner — mobile only, below header */}
      <div className="flex md:hidden w-full justify-center border-b border-border/40 bg-muted/20 py-1">
        <AdBanner size="mobile-banner" key={location.pathname} />
      </div>

      <AiChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
      <HelpDrawer />
      <TutorialTour active={tour.active} onComplete={tour.complete} />
      <Routes>
        {/* Logged-in users hitting / go straight to the app */}
        <Route path="/" element={<Navigate to="/applications" replace />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/new" element={<NewApplication />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/applications/:id/:tab" element={<ApplicationDetail />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/stories" element={<StoryBoard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/onboarding" element={<Navigate to="/applications" replace />} />
        <Route path="/login" element={<Navigate to="/applications" replace />} />
        <Route path="/signup" element={<Navigate to="/applications" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy-request" element={<PrivacyRequest />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Sticky footer ad */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-background/95 backdrop-blur border-t border-border/40 py-1 md:hidden">
        <AdBanner size="sticky-footer" key={location.pathname} />
      </div>
      {/* Bottom padding so content clears sticky footer on mobile */}
      <div className="h-14 md:hidden" />
      <CookieConsent />
      <AdDebugIndicator />
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            {isSingleUserWorkflowEnabled() ? (
              <SingleUserApp />
            ) : (
              <AuthProvider>
                <AuthenticatedApp />
              </AuthProvider>
            )}
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
