import { apiFetch } from "./client";
import type { AnalyticsOverview, AnalyticsTimeline, DistrictStats, HeatmapPoint } from "./types";

export function getOverview(): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>("/analytics/overview/");
}

export function getDistrictStats(): Promise<DistrictStats[]> {
  return apiFetch<DistrictStats[]>("/analytics/districts/");
}

export function getTimeline(days?: number): Promise<AnalyticsTimeline> {
  const query = days ? `?days=${days}` : "";
  return apiFetch<AnalyticsTimeline>(`/analytics/timeline/${query}`);
}

export function getHeatmapPoints(): Promise<HeatmapPoint[]> {
  return apiFetch<HeatmapPoint[]>("/analytics/heatmap/");
}
