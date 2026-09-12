import { apiFetch } from "./client";
import type { Category, PaginatedResponse } from "./types";

export function listCategories(): Promise<PaginatedResponse<Category>> {
  return apiFetch<PaginatedResponse<Category>>("/categories/");
}
