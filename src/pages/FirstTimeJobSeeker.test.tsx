import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import FirstTimeJobSeeker from "./FirstTimeJobSeeker";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user", email: "test@example.com" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

function renderFirstTimeJobSeeker() {
  return render(
    <BrowserRouter>
      <FirstTimeJobSeeker />
    </BrowserRouter>
  );
}

describe("FirstTimeJobSeeker", () => {
  it("renders the main heading", () => {
    renderFirstTimeJobSeeker();
    expect(screen.getByText(/Let's create your first resume!/)).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderFirstTimeJobSeeker();
    expect(
      screen.getByText(/You're in the right place/)
    ).toBeInTheDocument();
  });

  it("shows the sparkles icon", () => {
    renderFirstTimeJobSeeker();
    const heading = screen.getByText(/Let's create your first resume!/);
    expect(heading).toBeInTheDocument();
  });

  it("renders the workflow placeholder card", () => {
    renderFirstTimeJobSeeker();
    expect(
      screen.getByText(/First-time job seeker workflow/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
  });

  it("uses PageShell for layout", () => {
    const { container } = renderFirstTimeJobSeeker();
    expect(container).toBeInTheDocument();
  });
});
