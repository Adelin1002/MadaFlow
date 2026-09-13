import { describe, it, expect, vi } from "vitest";
import { apiFetch } from "../client";
import { createReport, uploadReportImage } from "../reports";

vi.mock("../client", () => ({
  apiFetch: vi.fn().mockResolvedValue({ id: "report-1" }),
}));

describe("createReport", () => {
  it("posts to /reports/ with the full payload as JSON", async () => {
    await createReport({
      category: "cat-1",
      title: "Trou dans la route",
      description: "Nid-de-poule dangereux",
      severity: "high",
      latitude: -21.4536,
      longitude: 47.0833,
    });

    expect(apiFetch).toHaveBeenCalledWith("/reports/", {
      method: "POST",
      body: {
        category: "cat-1",
        title: "Trou dans la route",
        description: "Nid-de-poule dangereux",
        severity: "high",
        latitude: -21.4536,
        longitude: 47.0833,
      },
    });
  });

  it("includes approximate_address when provided", async () => {
    await createReport({
      category: "cat-1",
      title: "Test",
      description: "Test",
      severity: "low",
      latitude: 0,
      longitude: 0,
      approximate_address: "Rue principale",
    });

    const [, init] = vi.mocked(apiFetch).mock.calls.at(-1)!;
    expect((init as { body: { approximate_address?: string } }).body.approximate_address).toBe(
      "Rue principale",
    );
  });
});

describe("uploadReportImage", () => {
  it("posts a FormData body to /reports/{id}/images/", async () => {
    const file = new File(["fake-image-content"], "photo.jpg", { type: "image/jpeg" });
    await uploadReportImage("report-1", file);

    const [url, init] = vi.mocked(apiFetch).mock.calls.at(-1)!;
    expect(url).toBe("/reports/report-1/images/");
    expect((init as { method: string }).method).toBe("POST");
    const formData = (init as { body: FormData }).body;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("image")).toBe(file);
  });
});
