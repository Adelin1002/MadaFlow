import { apiFetch } from "./client";
import type { AIAnalysis, PaginatedResponse, Report, ReportSeverity, ReportStatus } from "./types";

export interface ReportListFilters {
  category?: string;
  district?: string;
  status?: ReportStatus;
  severity?: ReportSeverity;
  priority?: "low" | "medium" | "high" | "critical";
  search?: string;
  ordering?: string;
  /** Numéro de page — DRF utilise `?page=N` (PageNumberPagination, voir backend). */
  page?: number;
}

function buildQueryString(filters: ReportListFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listReports(filters: ReportListFilters = {}): Promise<PaginatedResponse<Report>> {
  return apiFetch<PaginatedResponse<Report>>(`/reports/${buildQueryString(filters)}`);
}

export function getReport(id: string): Promise<Report> {
  return apiFetch<Report>(`/reports/${id}/`);
}

export function confirmReport(id: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/reports/${id}/confirm/`, { method: "POST" });
}

export interface CreateReportPayload {
  category: string;
  title: string;
  description: string;
  severity: ReportSeverity;
  latitude: number;
  longitude: number;
  approximate_address?: string;
}

export function createReport(payload: CreateReportPayload): Promise<Report> {
  return apiFetch<Report>("/reports/", { method: "POST", body: payload });
}

export function uploadReportImage(reportId: string, file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch<{ id: string }>(`/reports/${reportId}/images/`, {
    method: "POST",
    body: formData,
  });
}

/**
 * Réservé municipal_admin/platform_admin côté backend (IsMunicipalOrPlatformAdmin,
 * Étape 3) — un citoyen qui l'appelle reçoit 403. Le composant appelant
 * n'a donc pas besoin de revérifier le rôle avant d'appeler, seulement
 * avant d'afficher le contrôle lui-même.
 *
 * ATTENTION : la réponse n'est PAS un Report complet — ReportStatusSerializer
 * (backend) ne renvoie que {status, resolved_at} (confirmé contre le vrai
 * serveur). Ne jamais l'utiliser pour remplacer un Report entier en state.
 */
export interface UpdateStatusResponse {
  status: ReportStatus;
  resolved_at: string | null;
}

export function updateReportStatus(
  id: string,
  status: ReportStatus,
): Promise<UpdateStatusResponse> {
  return apiFetch<UpdateStatusResponse>(`/reports/${id}/status_update/`, {
    method: "PATCH",
    body: { status },
  });
}

/**
 * Fusionne le patch partiel renvoyé par updateReportStatus dans un Report
 * complet déjà en mémoire — jamais l'inverse (remplacer le Report par le
 * patch), qui perdrait title/description/images/etc. Extrait en fonction
 * testable après qu'une version inline de cette fusion s'est révélée
 * nécessaire suite à une hypothèse de forme de réponse erronée.
 */
export function applyStatusPatch(report: Report, patch: UpdateStatusResponse): Report {
  return { ...report, ...patch };
}

/** Réservé municipal_admin/platform_admin côté backend (Étape 6). */
export function getReportAiAnalyses(id: string): Promise<AIAnalysis[]> {
  return apiFetch<AIAnalysis[]>(`/reports/${id}/ai_analyses/`);
}
