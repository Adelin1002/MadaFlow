import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

function makeRequest(path: string, hasSession = false): NextRequest {
  const request = new NextRequest(new URL(`http://localhost:3000${path}`));
  if (hasSession) {
    // La construction via `headers: { cookie: "..." }` ne fonctionne pas :
    // "Cookie" est un en-tête interdit par la spec Fetch, silencieusement
    // ignoré par Request/Headers. `request.cookies.set()` est la seule
    // façon fiable de simuler un cookie entrant dans un test.
    request.cookies.set("madaflow_session", "1");
  }
  return request;
}

describe("proxy", () => {
  it("redirects to /login when visiting a protected route without a session", () => {
    const response = proxy(makeRequest("/map"));
    expect(response.status).toBe(307); // redirection par défaut de NextResponse.redirect
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/map");
  });

  it("preserves a nested protected path in the next= param", () => {
    const response = proxy(makeRequest("/reports/abc-123"));
    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("next")).toBe("/reports/abc-123");
  });

  it("lets a protected route through when a session cookie is present", () => {
    const response = proxy(makeRequest("/map", true));
    expect(response.status).toBe(200); // NextResponse.next()
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an already-logged-in user away from /login", () => {
    const response = proxy(makeRequest("/login", true));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/map");
  });

  it("redirects an already-logged-in user away from /register", () => {
    const response = proxy(makeRequest("/register", true));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/map");
  });

  it("lets an anonymous visitor reach /login and /register normally", () => {
    expect(proxy(makeRequest("/login")).status).toBe(200);
    expect(proxy(makeRequest("/register")).status).toBe(200);
  });

  it("never redirects the public home page", () => {
    expect(proxy(makeRequest("/")).status).toBe(200);
    const withSession = proxy(makeRequest("/", true));
    expect(withSession.status).toBe(200);
  });

  it("treats every listed protected prefix consistently", () => {
    for (const path of ["/reports", "/create-report", "/profile", "/dashboard"]) {
      const response = proxy(makeRequest(path));
      expect(response.status).toBe(307);
    }
  });
});
