import { describe, it, expect, vi } from "vitest";
import { apiFetch } from "../client";
import { getDistrictStats, getHeatmapPoints, getOverview, getTimeline } from "../analytics";

vi.mock("../client", () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

describe("analytics API functions", () => {
  it("getOverview calls /analytics/overview/", async () => {
    await getOverview();
    expect(apiFetch).toHaveBeenCalledWith("/analytics/overview/");
  });

  it("getDistrictStats calls /analytics/districts/", async () => {
    await getDistrictStats();
    expect(apiFetch).toHaveBeenCalledWith("/analytics/districts/");
  });

  it("getTimeline calls /analytics/timeline/ without params by default", async () => {
    await getTimeline();
    expect(apiFetch).toHaveBeenCalledWith("/analytics/timeline/");
  });

  it("getTimeline includes ?days= when provided", async () => {
    await getTimeline(7);
    expect(apiFetch).toHaveBeenCalledWith("/analytics/timeline/?days=7");
  });

  it("getHeatmapPoints calls /analytics/heatmap/", async () => {
    await getHeatmapPoints();
    expect(apiFetch).toHaveBeenCalledWith("/analytics/heatmap/");
  });
});
