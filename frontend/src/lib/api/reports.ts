import { apiFetch } from "./client";
import type { PaginatedResponse, Report, ReportSeverity, ReportStatus } from "./types";

export interface ReportListFilters {
  category?: string;
  district?: string;
  status?: ReportStatus;
  severity?: ReportSeverity;
  priority?: "low" | "medium" | "high" | "critical";
  search?: string;
}

function buildQueryString(filters: ReportListFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
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
