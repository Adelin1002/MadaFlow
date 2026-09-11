import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "../token-storage";

describe("tokenStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
});
