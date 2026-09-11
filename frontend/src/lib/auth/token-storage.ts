/**
 * Isolé dans son propre module pour deux raisons : rester testable sans
 * dépendre d'un vrai navigateur (les tests injectent un localStorage via
 * happy-dom, voir vitest.config.ts), et pouvoir être remplacé plus tard par
 * un stockage en cookie httpOnly côté serveur sans toucher au reste du code
 * (voir la limite documentée dans le README sur le choix localStorage pour
 * ce MVP).
 */
const ACCESS_TOKEN_KEY = "madaflow_access_token";
const REFRESH_TOKEN_KEY = "madaflow_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(access: string, refresh: string): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },

  setAccessToken(access: string): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  },

  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
