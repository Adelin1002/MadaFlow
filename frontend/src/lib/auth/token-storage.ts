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

/**
 * Cookie non-httpOnly, non signé, posé uniquement pour que proxy.ts (edge
 * runtime, sans accès à localStorage) puisse faire une vérification
 * "optimiste" de présence de session et éviter d'afficher le squelette
 * d'une page protégée avant de rediriger vers /login. Ce n'est PAS une
 * barrière de sécurité — celle-ci reste entièrement côté API Django
 * (IsAuthenticated + JWT). Voir src/proxy.ts.
 */
const SESSION_COOKIE = "madaflow_session";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function setSessionCookie(): void {
  if (!isBrowser()) return;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function clearSessionCookie(): void {
  if (!isBrowser()) return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
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
    setSessionCookie();
  },

  setAccessToken(access: string): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  },

  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearSessionCookie();
  },
};
