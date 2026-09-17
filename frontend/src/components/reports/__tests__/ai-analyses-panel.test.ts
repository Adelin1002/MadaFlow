import { describe, it, expect } from "vitest";
import { renderResult } from "../ai-analyses-panel";
import type { AIAnalysis } from "@/lib/api/types";

function analysis(overrides: Partial<AIAnalysis>): AIAnalysis {
  return {
    id: "analysis-1",
    analysis_type: "classification",
    provider: "rule_based",
    result: {},
    confidence: null,
    data_source: "real",
    created_at: "2026-06-15T12:00:00Z",
    ...overrides,
  };
}

describe("renderResult", () => {
  it("shows the suggested category for a classification analysis", () => {
    const result = renderResult(
      analysis({ analysis_type: "classification", result: { category_guess: "route" } }),
    );
    expect(result).toBe("Catégorie suggérée : route");
  });

  it("shows a fallback when the classification result is malformed", () => {
    const result = renderResult(analysis({ analysis_type: "classification", result: {} }));
    expect(result).toBe("Résultat indisponible.");
  });

  it("shows the summary text for a summary analysis", () => {
    const result = renderResult(
      analysis({ analysis_type: "summary", result: { summary: "Un trou dangereux." } }),
    );
    expect(result).toBe("Un trou dangereux.");
  });

  it("reports no duplicates found when the list is empty", () => {
    const result = renderResult(
      analysis({ analysis_type: "duplicate_detection", result: { duplicates: [] } }),
    );
    expect(result).toBe("Aucun doublon détecté.");
  });

  it("counts duplicate candidates when present", () => {
    const result = renderResult(
      analysis({
        analysis_type: "duplicate_detection",
        result: { duplicates: [{ id: "a" }, { id: "b" }] },
      }),
    );
    expect(result).toBe("2 candidat(s) doublon détecté(s).");
  });

  it("falls back for analysis types without a dedicated renderer", () => {
    const result = renderResult(analysis({ analysis_type: "anomaly", result: {} }));
    expect(result).toBe("Résultat indisponible.");
  });
});
