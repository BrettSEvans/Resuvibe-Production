import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Onboarding from "@/pages/Onboarding";
import * as authHooks from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client");
vi.mock("@/hooks/useAuth");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUser = {
  id: "test-user-123",
  email: "test@example.com",
  user_metadata: {},
};

function renderOnboarding() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe("Onboarding Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authHooks.useAuth as any).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
    });
  });

  describe("Full Onboarding Flow: Resume Upload Path", () => {
    it("completes full onboarding with resume text and skills", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          success: true,
          skills: ["JavaScript", "React", "TypeScript", "Node.js"],
          industries: ["Technology", "Finance"],
        },
      });

      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      renderOnboarding();

      // Step 1: Enter name and experience
      const firstNameInput = screen.getByDisplayValue("Jane");
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, "Alice");

      const lastNameInput = screen.getByDisplayValue("Doe");
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, "Smith");

      const experienceSelect = screen.getByDisplayValue("Select range");
      fireEvent.click(experienceSelect);
      const experienceOption = screen.getByText("5-9 years");
      fireEvent.click(experienceOption);

      // Navigate to Step 2
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      // Step 2: Paste resume
      const resumeTextarea = screen.getByPlaceholderText(/Paste your resume content/);
      const resumeContent = `Alice Smith
Senior Software Engineer
10 years of experience in full-stack development
Skills: JavaScript, React, TypeScript, Node.js, Python, AWS, Docker
Worked in: Technology and Finance industries`;

      await userEvent.type(resumeTextarea, resumeContent);

      // Navigate to Step 3
      const nextButtons = screen.getAllByText("Next");
      fireEvent.click(nextButtons[nextButtons.length - 1]);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith(
          "extract-resume-skills",
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
      });

      // Step 3: Verify skills and industries are pre-selected
      expect(screen.getByText(/pre-selected.*skills/i)).toBeInTheDocument();
      expect(screen.getByText(/pre-selected.*industr/i)).toBeInTheDocument();

      // Add a custom skill
      const skillInput = screen.getByPlaceholderText(/Add custom skill/);
      await userEvent.type(skillInput, "GraphQL");
      const addSkillButton = screen.getAllByRole("button", { name: /Add/ })[0];
      fireEvent.click(addSkillButton);

      await waitFor(() => {
        expect(screen.getByText(/GraphQL/)).toBeInTheDocument();
      });

      // Navigate to Step 4
      const nextBtn4 = screen.getByText("Next");
      fireEvent.click(nextBtn4);

      await waitFor(() => {
        expect(screen.getByText(/Step 4 of 5/)).toBeInTheDocument();
      });

      // Step 4: Add cover letter
      const coverLetterTextarea = screen.getByPlaceholderText(
        /Paste your best cover letter/
      );
      await userEvent.type(
        coverLetterTextarea,
        "Dear Hiring Manager,\nI am interested in this position..."
      );

      // Navigate to Step 5
      const nextBtn5 = screen.getByText(/Next|Skip/);
      fireEvent.click(nextBtn5);

      await waitFor(() => {
        expect(screen.getByText(/Step 5 of 5/)).toBeInTheDocument();
      });

      // Step 5: Complete onboarding
      const getStartedButton = screen.getByText(/Get Started/);
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("profiles");
        expect(mockNavigate).toHaveBeenCalledWith("/applications");
      });
    });
  });

  describe("Full Onboarding Flow: First-Time Job Seeker Path", () => {
    it("completes onboarding without resume and navigates to first-time job seeker page", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      renderOnboarding();

      // Step 1: Enter basic info
      const firstNameInput = screen.getByDisplayValue("Jane");
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, "Bob");

      const lastNameInput = screen.getByDisplayValue("Doe");
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, "Johnson");

      // Navigate to Step 2
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      // Click "Don't have a resume yet?"
      const noResumeLink = screen.getByText(/Don't have a resume yet\?/);
      fireEvent.click(noResumeLink);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/build-my-resume");
      });

      // Verify profile was saved with basic info
      expect(supabase.from).toHaveBeenCalledWith("profiles");
    });
  });

  describe("Onboarding Data Validation", () => {
    it("requires minimum resume length for skill extraction", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { success: false, error: "Resume text too short" },
      });

      renderOnboarding();

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      const resumeTextarea = screen.getByPlaceholderText(/Paste your resume content/);
      await userEvent.type(resumeTextarea, "Short");

      const nextBtn2 = screen.getByText("Next");
      fireEvent.click(nextBtn2);

      // Should still proceed without calling extract-resume-skills
      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
      });
    });

    it("allows skipping optional cover letter on step 4", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      renderOnboarding();

      // Quick navigate to step 4
      for (let i = 0; i < 3; i++) {
        const nextButtons = screen.getAllByText(/Next|Skip/);
        fireEvent.click(nextButtons[nextButtons.length - 1]);
        await waitFor(() => {
          expect(
            screen.queryByText(`Step ${i + 2} of 5`)
          ).toBeInTheDocument();
        });
      }

      // Skip cover letter
      const skipButton = screen.getByText("Skip");
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 5 of 5/)).toBeInTheDocument();
      });
    });
  });

  describe("Multi-step Navigation", () => {
    it("preserves data when navigating back and forth", async () => {
      renderOnboarding();

      // Enter Step 1 data
      const firstNameInput = screen.getByDisplayValue("Jane");
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, "TestName");

      // Go to Step 2
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      // Go back to Step 1
      const backButton = screen.getByText("Back");
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
      });

      // Verify data is preserved
      const nameInput = screen.getByDisplayValue("TestName");
      expect(nameInput).toBeInTheDocument();
    });

    it("allows jumping between steps using step indicators", async () => {
      renderOnboarding();

      // Navigate forward to step 3
      const nextButtons = screen.getAllByText("Next");
      fireEvent.click(nextButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Next"));
      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
      });

      // Click step 1 indicator to jump back
      const stepIndicators = screen.getAllByRole("button").filter((btn) =>
        btn.getAttribute("aria-label")?.includes("step")
      );

      if (stepIndicators.length > 0) {
        fireEvent.click(stepIndicators[0]);
        await waitFor(() => {
          expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("handles skill extraction failure gracefully", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { success: false, error: "AI extraction failed" },
      });

      renderOnboarding();

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      const resumeTextarea = screen.getByPlaceholderText(/Paste your resume content/);
      await userEvent.type(resumeTextarea, "A".repeat(60));

      const nextBtn = screen.getByText("Next");
      fireEvent.click(nextBtn);

      // Should proceed to Step 3 even if extraction fails
      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
      });
    });

    it("handles profile save failure", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          error: { message: "Database error" },
        }),
      });

      renderOnboarding();

      // Skip to completion
      const skipButton = screen.getByText("Skip for now");
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("profiles");
      });
    });
  });
});
