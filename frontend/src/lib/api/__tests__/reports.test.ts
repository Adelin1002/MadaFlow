import { describe, it, expect, vi } from "vitest";
import { apiFetch } from "../client";
import { listReports } from "../reports";

vi.mock("../client", () => ({
  apiFetch: vi.fn().mockResolvedValue({ count: 0, next: null, previous: null, results: [] }),
}));

describe("listReports", () => {
  it("calls /reports/ without query string when no filter is given", async () => {
    await listReports();
    expect(apiFetch).toHaveBeenCalledWith("/reports/");
  });

  it("includes a single filter in the query string", async () => {
    await listReports({ status: "new" });
    expect(apiFetch).toHaveBeenCalledWith("/reports/?status=new");
  });

  it("combines multiple filters", async () => {
    await listReports({ status: "new", severity: "critical" });
    const [url] = vi.mocked(apiFetch).mock.calls.at(-1)!;
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("status")).toBe("new");
    expect(params.get("severity")).toBe("critical");
  });

  it("omits falsy filter values", async () => {
    await listReports({ category: undefined, status: "resolved" });
    expect(apiFetch).toHaveBeenCalledWith("/reports/?status=resolved");
  });

  it("includes the page number as a string query param", async () => {
    await listReports({ page: 2 });
    expect(apiFetch).toHaveBeenCalledWith("/reports/?page=2");
  });

  it("omits page=1 the same way any other falsy-like default would not apply here", async () => {
    // page est un number, donc seule la valeur 0 serait "falsy" — non pertinente
    // pour une pagination 1-indexée côté DRF. page=1 doit bien être inclus si fourni explicitement.
    await listReports({ page: 1 });
    expect(apiFetch).toHaveBeenCalledWith("/reports/?page=1");
  });
});
