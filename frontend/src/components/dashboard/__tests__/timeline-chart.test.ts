import { describe, it, expect } from "vitest";
import { buildDateAxis } from "../timeline-chart";
import type { AnalyticsTimeline } from "@/lib/api/types";

function timeline(created: string[], resolved: string[]): AnalyticsTimeline {
  return {
    window_days: 30,
    created: created.map((date) => ({ date, count: 1 })),
    resolved: resolved.map((date) => ({ date, count: 1 })),
  };
}

describe("buildDateAxis", () => {
  it("returns an empty array when both series are empty", () => {
    expect(buildDateAxis(timeline([], []))).toEqual([]);
  });

  it("merges dates present in only one series", () => {
    const result = buildDateAxis(timeline(["2026-06-01"], ["2026-06-02"]));
    expect(result).toEqual(["2026-06-01", "2026-06-02"]);
  });

  it("deduplicates a date present in both series", () => {
    const result = buildDateAxis(timeline(["2026-06-01"], ["2026-06-01"]));
    expect(result).toEqual(["2026-06-01"]);
  });

  it("returns dates sorted chronologically regardless of input order", () => {
    const result = buildDateAxis(timeline(["2026-06-03", "2026-06-01"], ["2026-06-02"]));
    expect(result).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });
});
