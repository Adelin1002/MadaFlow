import { tokenStorage } from "@/lib/auth/token-storage";
import type { ApiErrorBody } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail ?? "Erreur API");
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Interne : empêche une boucle infinie si le rafraîchissement lui-même échoue en 401. */
  _isRetry?: boolean;
}

/**
 * Un seul rafraîchissement en vol à la fois : si plusieurs requêtes essuient
 * un 401 en même temps, elles doivent toutes attendre le même appel à
 * /auth/refresh/ plutôt que d'en déclencher un chacune (ce qui invaliderait
 * les refresh tokens suivants, puisque SIMPLE_JWT tourne avec
 * ROTATE_REFRESH_TOKENS=True côté backend).
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then(async (response) => {
        if (!response.ok) {
          tokenStorage.clear();
          return null;
        }
        const data = (await response.json()) as { access: string };
        tokenStorage.setAccessToken(data.access);
        return data.access;
      })
      .catch(() => {
        tokenStorage.clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, _isRetry, headers, ...rest } = options;
  const accessToken = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !_isRetry && path !== "/auth/refresh/") {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, (data as ApiErrorBody) ?? {});
  }

  return data as T;
}
