import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Vérification "optimiste" uniquement (voir la doc Next.js sur Proxy,
 * section "Optimistic checks with Proxy") : la présence du cookie
 * madaflow_session ne prouve rien côté sécurité — c'est une simple
 * indication pour éviter d'afficher le squelette d'une page protégée à
 * quelqu'un de non connecté, le temps d'une redirection. La vraie barrière
 * de sécurité reste IsAuthenticated côté API Django (JWT réels, stockés en
 * localStorage — inaccessible ici, en edge runtime). Voir
 * src/lib/auth/token-storage.ts.
 */
const SESSION_COOKIE = "madaflow_session";

// Certaines de ces routes n'existent pas encore (section 18 du cahier des
// charges) — les lister maintenant évite de revenir modifier ce fichier à
// chaque nouvelle page protégée ajoutée.
const PROTECTED_PREFIXES = [
  "/map",
  "/reports",
  "/create-report",
  "/profile",
  "/dashboard",
  "/analytics",
  "/business",
  "/alerts",
  "/settings",
  "/admin",
];

const AUTH_ONLY_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_ROUTES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/map", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
