"use client";

import { useEffect, useState } from "react";
import { getReportAiAnalyses } from "@/lib/api/reports";
import type { AIAnalysis } from "@/lib/api/types";

const TYPE_LABELS: Record<AIAnalysis["analysis_type"], string> = {
  classification: "Classification suggérée",
  duplicate_detection: "Détection de doublons",
  summary: "Résumé",
  image_analysis: "Analyse d'image",
  anomaly: "Anomalie",
  prediction: "Prédiction",
};

/**
 * La forme de `result` dépend de `analysis_type` (voir
 * apps.ai_engine.services côté backend) — pas de type précis par variante,
 * on lit défensivement les champs attendus pour chacune.
 */
export function renderResult(analysis: AIAnalysis): string {
  switch (analysis.analysis_type) {
    case "classification": {
      const guess = analysis.result.category_guess;
      return typeof guess === "string" ? `Catégorie suggérée : ${guess}` : "Résultat indisponible.";
    }
    case "summary": {
      const summary = analysis.result.summary;
      return typeof summary === "string" ? summary : "Résultat indisponible.";
    }
    case "duplicate_detection": {
      const duplicates = analysis.result.duplicates;
      if (!Array.isArray(duplicates) || duplicates.length === 0) return "Aucun doublon détecté.";
      return `${duplicates.length} candidat(s) doublon détecté(s).`;
    }
    default:
      return "Résultat indisponible.";
  }
}

export function AiAnalysesPanel({ reportId }: { reportId: string }) {
  const [analyses, setAnalyses] = useState<AIAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReportAiAnalyses(reportId)
      .then(setAnalyses)
      .catch(() => setError("Impossible de charger le diagnostic IA."));
  }, [reportId]);

  return (
    <div className="border border-stone p-4">
      <p className="text-sm font-medium">Diagnostic IA</p>
      <p className="mt-1 text-xs text-ink-soft">Réservé aux administrateurs.</p>

      {error && <p className="mt-2 text-xs text-laterite">{error}</p>}
      {!analyses && !error && <p className="mt-2 text-xs text-ink-soft">Chargement…</p>}
      {analyses && analyses.length === 0 && (
        <p className="mt-2 text-xs text-ink-soft">
          Analyse pas encore calculée (tâche asynchrone, voir README backend sur le worker Celery).
        </p>
      )}
      {analyses && analyses.length > 0 && (
        <ul className="mt-3 space-y-3 text-xs">
          {analyses.map((analysis) => (
            <li
              key={analysis.id}
              className="border-t border-stone pt-2 first:border-t-0 first:pt-0"
            >
              <p className="font-medium text-ink">{TYPE_LABELS[analysis.analysis_type]}</p>
              <p className="mt-0.5 text-ink-soft">{renderResult(analysis)}</p>
              {analysis.confidence !== null && (
                <p className="mt-0.5 text-ink-soft">
                  Confiance : {Math.round(analysis.confidence * 100)}%
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
