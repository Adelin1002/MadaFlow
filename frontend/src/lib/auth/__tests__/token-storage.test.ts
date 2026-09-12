import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "../token-storage";

describe("tokenStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = "madaflow_session=; path=/; max-age=0";
  });

  it("returns null when nothing is stored", () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("stores and retrieves both tokens", () => {
    tokenStorage.setTokens("access-123", "refresh-456");
    expect(tokenStorage.getAccessToken()).toBe("access-123");
    expect(tokenStorage.getRefreshToken()).toBe("refresh-456");
  });

  it("setAccessToken updates only the access token", () => {
    tokenStorage.setTokens("access-1", "refresh-1");
    tokenStorage.setAccessToken("access-2");
    expect(tokenStorage.getAccessToken()).toBe("access-2");
    expect(tokenStorage.getRefreshToken()).toBe("refresh-1");
  });

  it("clear removes both tokens", () => {
    tokenStorage.setTokens("access-1", "refresh-1");
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  describe("session cookie (lu par proxy.ts, voir src/proxy.ts)", () => {
    it("is absent before any login", () => {
      expect(document.cookie).not.toContain("madaflow_session=1");
    });

    it("is set when tokens are stored", () => {
      tokenStorage.setTokens("access-1", "refresh-1");
      expect(document.cookie).toContain("madaflow_session=1");
    });

    it("is removed on clear", () => {
      tokenStorage.setTokens("access-1", "refresh-1");
      tokenStorage.clear();
      expect(document.cookie).not.toContain("madaflow_session=1");
    });

    it("is not affected by setAccessToken alone", () => {
      // setAccessToken sert au rafraîchissement silencieux (voir client.ts) —
      // la session existe déjà, pas besoin de reposer le cookie.
      tokenStorage.setAccessToken("access-only");
      expect(document.cookie).not.toContain("madaflow_session=1");
    });
  });
});
