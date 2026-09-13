import { apiFetch } from "./client";
import type { PaginatedResponse, Report, ReportSeverity, ReportStatus } from "./types";

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
