import { describe, it, expect, vi } from "vitest";
import { apiFetch } from "../client";
import { applyStatusPatch, getReportAiAnalyses, updateReportStatus } from "../reports";
import type { Report } from "../types";

vi.mock("../client", () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

describe("updateReportStatus", () => {
  it("sends a PATCH request to /reports/{id}/status_update/ with the new status", async () => {
    await updateReportStatus("report-1", "resolved");

    expect(apiFetch).toHaveBeenCalledWith("/reports/report-1/status_update/", {
      method: "PATCH",
      body: { status: "resolved" },
    });
  });
});

describe("getReportAiAnalyses", () => {
  it("calls GET /reports/{id}/ai_analyses/", async () => {
    await getReportAiAnalyses("report-1");
    expect(apiFetch).toHaveBeenCalledWith("/reports/report-1/ai_analyses/");
  });
});

describe("applyStatusPatch", () => {
  it("merges the patch into the report without losing other fields", () => {
    const report = {
      id: "report-1",
      title: "Trou dans la route",
      description: "Nid-de-poule",
      status: "new",
      resolved_at: null,
      confirmations_count: 3,
    } as unknown as Report;

    const updated = applyStatusPatch(report, {
      status: "resolved",
      resolved_at: "2026-06-15T10:00:00Z",
    });

    expect(updated.title).toBe("Trou dans la route");
    expect(updated.confirmations_count).toBe(3);
    expect(updated.status).toBe("resolved");
    expect(updated.resolved_at).toBe("2026-06-15T10:00:00Z");
  });

  it("does not mutate the original report object", () => {
    const report = { id: "report-1", status: "new", resolved_at: null } as unknown as Report;
    const updated = applyStatusPatch(report, { status: "in_progress", resolved_at: null });

    expect(report.status).toBe("new");
    expect(updated).not.toBe(report);
  });
});
