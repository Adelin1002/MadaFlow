import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiFetch, ApiError } from "../client";
import { tokenStorage } from "@/lib/auth/token-storage";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("apiFetch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("performs a simple GET without Authorization header when no token is stored", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("/categories/");

    expect(result).toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("attaches Authorization header when an access token is stored", async () => {
    tokenStorage.setTokens("my-access-token", "my-refresh-token");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/reports/");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer my-access-token");
  });

  it("JSON-encodes a plain object body and sets Content-Type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, {}));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/reports/", { method: "POST", body: { title: "Trou" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "Trou" }));
  });

  it("does not JSON-encode or set Content-Type for FormData bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, {}));
    vi.stubGlobal("fetch", fetchMock);

    const formData = new FormData();
    formData.append("image", "fake");
    await apiFetch("/reports/1/images/", { method: "POST", body: formData });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBe(formData);
  });

  it("throws ApiError with parsed body on a non-2xx response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(400, { title: ["Ce champ est requis."] }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = apiFetch("/reports/", { method: "POST", body: {} });
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 400,
      body: { title: ["Ce champ est requis."] },
    });
  });

  it("returns undefined for a 204 No Content response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/reports/1/");
    expect(result).toBeUndefined();
  });

  describe("automatic token refresh on 401", () => {
    it("refreshes the access token once and retries the original request", async () => {
      tokenStorage.setTokens("expired-access", "valid-refresh");

      const fetchMock = vi
        .fn()
        // 1) requête initiale -> 401
        .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expiré" }))
        // 2) refresh -> succès
        .mockResolvedValueOnce(jsonResponse(200, { access: "new-access" }))
        // 3) requête réessayée -> succès
        .mockResolvedValueOnce(jsonResponse(200, { data: "ok" }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await apiFetch<{ data: string }>("/reports/");

      expect(result).toEqual({ data: "ok" });
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh/");
      // La requête réessayée porte bien le nouveau token.
      expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer new-access");
      // Le nouveau token est persisté pour les requêtes suivantes.
      expect(tokenStorage.getAccessToken()).toBe("new-access");
    });

    it("clears tokens and throws the original 401 if the refresh itself fails", async () => {
      tokenStorage.setTokens("expired-access", "invalid-refresh");

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(401, { detail: "Token expiré" }))
        .mockResolvedValueOnce(jsonResponse(401, { detail: "Refresh invalide" }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(apiFetch("/reports/")).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(2); // pas de 3e tentative
      expect(tokenStorage.getAccessToken()).toBeNull();
      expect(tokenStorage.getRefreshToken()).toBeNull();
    });

    it("never attempts to refresh when the failing request IS the refresh endpoint", async () => {
      tokenStorage.setTokens("access", "refresh");
      const fetchMock = vi
        .fn()
        .mockResolvedValue(jsonResponse(401, { detail: "Refresh invalide" }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        apiFetch("/auth/refresh/", { method: "POST", body: { refresh: "refresh" } }),
      ).rejects.toMatchObject({ status: 401 });

      expect(fetchMock).toHaveBeenCalledTimes(1); // pas de tentative de rafraîchir le rafraîchissement
    });

    it("does not attempt refresh at all when there is no refresh token stored", async () => {
      tokenStorage.setAccessToken("expired-access"); // pas de refresh token
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { detail: "Token expiré" }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(apiFetch("/reports/")).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(1); // aucun appel à /auth/refresh/
    });

    it("shares a single in-flight refresh across concurrent 401s", async () => {
      tokenStorage.setTokens("expired-access", "valid-refresh");

      let refreshCallCount = 0;
      let originalRequestCallCount = 0;
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/auth/refresh/")) {
          refreshCallCount += 1;
          return Promise.resolve(jsonResponse(200, { access: "new-access" }));
        }
        originalRequestCallCount += 1;
        // Les deux premiers appels (les requêtes originales, avant tout
        // rafraîchissement) échouent en 401 ; les suivants (les retries,
        // avec le nouveau token) réussissent.
        if (originalRequestCallCount <= 2) {
          return Promise.resolve(jsonResponse(401, { detail: "Token expiré" }));
        }
        return Promise.resolve(jsonResponse(200, { data: "ok" }));
      });
      vi.stubGlobal("fetch", fetchMock);

      const [first, second] = await Promise.all([apiFetch("/reports/"), apiFetch("/categories/")]);

      expect(first).toEqual({ data: "ok" });
      expect(second).toEqual({ data: "ok" });
      expect(refreshCallCount).toBe(1);
    });
  });
});
