import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";
import type { Viewer } from "@/lib/auth/dal";
import type { DashboardSummary } from "@/lib/data/dashboard";

const summary: DashboardSummary = {
  primaryCount: 0,
  secondaryCount: 0,
  tertiaryCount: 0,
  recentShifts: [],
};

const viewer: Viewer = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "qa@example.com",
  fullName: "QA Clinic",
  role: "organization",
  onboardingComplete: true,
  verificationStatus: "verified",
};

afterEach(cleanup);

describe("DashboardOverview verification card", () => {
  it("shows the completed state without a contradictory verification prompt", () => {
    render(<DashboardOverview locale="en" viewer={viewer} summary={summary} />);

    expect(screen.getByRole("heading", { name: "Verification complete" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Complete verification" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Verified account").length).toBeGreaterThan(0);
  });

  it("keeps the completion prompt for an account still under review", () => {
    render(<DashboardOverview locale="en" viewer={{ ...viewer, verificationStatus: "pending" }} summary={summary} />);

    expect(screen.getByRole("heading", { name: "Complete verification" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Verification complete" })).not.toBeInTheDocument();
  });

  it("shows actionable next-step links for professionals with pending verification", () => {
    render(<DashboardOverview locale="en" viewer={{ ...viewer, role: "professional", verificationStatus: "pending" }} summary={summary} />);

    expect(screen.getByRole("heading", { name: "What to do next" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Complete verification/i })).toBeInTheDocument();
    expect(screen.getByText("Filter by city/specialty and apply quickly.")).toBeInTheDocument();
    expect(screen.getByText("Check accepted, rejected, and pending updates.")).toBeInTheDocument();
  });

  it("shows admin-specific next-step actions", () => {
    render(<DashboardOverview locale="en" viewer={{ ...viewer, role: "admin" }} summary={summary} />);

    expect(screen.getByRole("heading", { name: "Admin next steps" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Review accounts and documents/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "What to do next" })).not.toBeInTheDocument();
  });
});
