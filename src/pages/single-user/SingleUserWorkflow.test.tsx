import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SingleUserNewApplication from "./SingleUserNewApplication";
import SingleUserSessionResult from "./SingleUserSessionResult";
import { clearSingleUserSessionResult, setSingleUserSessionResult } from "@/lib/singleUserSession";

vi.mock("@/lib/singleUserGeneration", () => ({
  generateSingleUserApplication: vi.fn(async () => ({
    id: "session-1",
    companyName: "Acme",
    jobTitle: "Senior Frontend Developer",
    resumeHtml: "<h1>Tailored Resume</h1>",
    coverLetter: "Tailored cover letter",
    createdAt: "2026-06-03T12:00:00.000Z",
  })),
}));

describe("single-user workflow screens", () => {
  beforeEach(() => {
    clearSingleUserSessionResult();
  });

  it("renders the unified new application workflow", () => {
    render(
      <MemoryRouter>
        <SingleUserNewApplication />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /start a new application/i })).toBeInTheDocument();
    expect(screen.getByText(/step 1: target job details/i)).toBeInTheDocument();
    expect(screen.getByText(/step 2: your source materials/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste resume text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste cover letter text/i)).toBeInTheDocument();
  });

  it("requires job description and resume source material before generating", async () => {
    render(
      <MemoryRouter>
        <SingleUserNewApplication />
      </MemoryRouter>,
    );

    const generate = screen.getByRole("button", { name: /generate application assets/i });
    expect(generate).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: "Build accessible React interfaces." },
    });
    fireEvent.change(screen.getByLabelText(/paste resume text/i), {
      target: { value: "Resume source text with React experience." },
    });

    expect(generate).toBeEnabled();
  });

  it("shows the ephemeral warning and export actions for generated results", () => {
    setSingleUserSessionResult({
      id: "session-1",
      companyName: "Acme",
      jobTitle: "Senior Frontend Developer",
      resumeHtml: "<h1>Tailored Resume</h1>",
      coverLetter: "Tailored cover letter",
      createdAt: "2026-06-03T12:00:00.000Z",
    });

    render(
      <MemoryRouter>
        <SingleUserSessionResult />
      </MemoryRouter>,
    );

    expect(screen.getByText(/session not saved/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /resume/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /cover letter/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy to clipboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download word docx/i })).toBeInTheDocument();
  });
});
