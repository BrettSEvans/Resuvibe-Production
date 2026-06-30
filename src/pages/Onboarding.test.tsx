import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Onboarding from "./Onboarding";
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

describe("Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authHooks.useAuth as any).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
    });
  });

  describe("Step 1: Name & Experience", () => {
    it("renders step 1 on initial load", () => {
      renderOnboarding();
      expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Years of Experience/)).toBeInTheDocument();
    });

    it("navigates to step 2 on next button click", async () => {
      renderOnboarding();
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });
    });

    it("allows skipping onboarding on step 1", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      renderOnboarding();
      const skipButton = screen.getByText("Skip for now");
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("profiles");
      });
    });
  });

  describe("Step 2: Resume Upload/Paste", () => {
    beforeEach(async () => {
      renderOnboarding();
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });
    });

    it("shows both upload and paste resume tabs", async () => {
      expect(screen.getByRole("tab", { name: /Upload Resume/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Paste Resume Text/ })).toBeInTheDocument();
    });

    it("defaults to paste resume tab", () => {
      expect(screen.getByPlaceholderText(/Paste your resume content/)).toBeInTheDocument();
    });

    it("allows switching to upload resume tab", async () => {
      const uploadTab = screen.getByRole("tab", { name: /Upload Resume/ });
      fireEvent.click(uploadTab);

      await waitFor(() => {
        expect(screen.getByText(/Upload your resume file/)).toBeInTheDocument();
      });
    });

    it("allows pasting resume text", async () => {
      const textarea = screen.getByPlaceholderText(/Paste your resume content/);
      await userEvent.type(textarea, "Jane Doe\nSoftware Engineer\n10 years experience");
      expect(textarea).toHaveValue("Jane Doe\nSoftware Engineer\n10 years experience");
    });

    it("shows 'Don't have a resume yet?' link", () => {
      expect(screen.getByText(/Don't have a resume yet\?/)).toBeInTheDocument();
    });

    it("clicking 'Don't have a resume yet?' completes onboarding and navigates", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      const link = screen.getByText(/Don't have a resume yet\?/);
      fireEvent.click(link);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/build-my-resume");
      });
    });

    it("extracts skills and industries on step transition with resume >= 50 chars", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          success: true,
          skills: ["JavaScript", "React", "Node.js"],
          industries: ["Technology", "Finance"],
        },
      });

      const textarea = screen.getByPlaceholderText(/Paste your resume content/);
      await userEvent.type(textarea, "A".repeat(50) + " resume with substantial content");

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith("extract-resume-skills", {
          body: expect.objectContaining({
            resumeText: expect.any(String),
          }),
        });
      });
    });
  });

  describe("Step 3: Skills & Industries", () => {
    beforeEach(async () => {
      renderOnboarding();
      const nextButton = screen.getAllByText("Next")[0];
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      // Mock skill extraction
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          success: true,
          skills: ["JavaScript", "React"],
          industries: ["Technology"],
        },
      });

      const textarea = screen.getByPlaceholderText(/Paste your resume content/);
      await userEvent.type(textarea, "A".repeat(50) + " resume");

      const nextBtn = screen.getByText("Next");
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
      });
    });

    it("shows key skills section", () => {
      expect(screen.getByLabelText(/Key Skills/)).toBeInTheDocument();
    });

    it("shows target industries section", () => {
      expect(screen.getByLabelText(/Target Industries/)).toBeInTheDocument();
    });

    it("allows selecting skills", async () => {
      const skillBadges = screen.getAllByText(/JavaScript/);
      if (skillBadges.length > 0) {
        fireEvent.click(skillBadges[0]);
        expect(skillBadges[0]).toHaveClass("bg-primary");
      }
    });

    it("allows adding custom skills", async () => {
      const input = screen.getByPlaceholderText(/Add custom skill/);
      await userEvent.type(input, "Python");
      const addButton = screen.getAllByRole("button", { name: /Add/ })[0];
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Python/)).toBeInTheDocument();
      });
    });

    it("allows adding custom industries", async () => {
      const input = screen.getByPlaceholderText(/Add custom industry/);
      await userEvent.type(input, "Healthcare");
      const addButtons = screen.getAllByRole("button", { name: /Add/ });
      fireEvent.click(addButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Healthcare/)).toBeInTheDocument();
      });
    });
  });

  describe("Step 4: Master Cover Letter Upload/Paste", () => {
    beforeEach(async () => {
      renderOnboarding();
      // Navigate through steps to reach step 4
      for (let i = 0; i < 3; i++) {
        const nextButtons = screen.getAllByText("Next");
        fireEvent.click(nextButtons[nextButtons.length - 1]);
        await waitFor(() => {
          expect(screen.queryByText(`Step ${i + 2} of 5`)).toBeInTheDocument();
        });
      }
    });

    it("shows both upload and paste cover letter tabs", async () => {
      expect(screen.getByRole("tab", { name: /Upload Cover Letter/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Paste Cover Letter/ })).toBeInTheDocument();
    });

    it("defaults to paste cover letter tab", () => {
      expect(
        screen.getByPlaceholderText(/Paste your best cover letter/)
      ).toBeInTheDocument();
    });

    it("allows switching to upload cover letter tab", async () => {
      const uploadTab = screen.getByRole("tab", { name: /Upload Cover Letter/ });
      fireEvent.click(uploadTab);

      await waitFor(() => {
        expect(screen.getByText(/Upload your cover letter file/)).toBeInTheDocument();
      });
    });

    it("allows pasting cover letter text", async () => {
      const textarea = screen.getByPlaceholderText(
        /Paste your best cover letter/
      );
      await userEvent.type(textarea, "Dear Hiring Manager...");
      expect(textarea).toHaveValue("Dear Hiring Manager...");
    });
  });

  describe("Step 5: Completion", () => {
    beforeEach(async () => {
      renderOnboarding();
      // Navigate through all steps
      for (let i = 0; i < 4; i++) {
        const nextButtons = screen.getAllByText(/Next|Skip/);
        fireEvent.click(nextButtons[nextButtons.length - 1]);
        await waitFor(() => {
          expect(
            screen.queryByText(`Step ${i + 2} of 5`)
          ).toBeInTheDocument();
        });
      }
    });

    it("shows completion message", () => {
      expect(screen.getByText(/You're all set!/)).toBeInTheDocument();
    });

    it("shows get started button", () => {
      expect(screen.getByText(/Get Started/)).toBeInTheDocument();
    });

    it("completes onboarding on get started click", async () => {
      (supabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      const getStartedButton = screen.getByText(/Get Started/);
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/applications");
      });
    });
  });

  describe("Step Navigation", () => {
    it("back button navigates to previous step", async () => {
      renderOnboarding();
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      const backButton = screen.getByText("Back");
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
      });
    });

    it("allows clicking completed step indicators to navigate back", async () => {
      renderOnboarding();
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
      });

      const stepIndicators = screen.getAllByRole("button").filter(btn =>
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
});
