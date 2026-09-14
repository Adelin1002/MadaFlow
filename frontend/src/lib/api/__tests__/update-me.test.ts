import { describe, it, expect, vi } from "vitest";
import { apiFetch } from "../client";
import { updateMe } from "../auth";

vi.mock("../client", () => ({
  apiFetch: vi.fn().mockResolvedValue({ id: "user-1", username: "test" }),
}));

describe("updateMe", () => {
  it("sends a PATCH request to /users/me/ with the given payload", async () => {
    await updateMe({ email: "nouveau@example.mg", phone_number: "0340000000" });

    expect(apiFetch).toHaveBeenCalledWith("/users/me/", {
      method: "PATCH",
      body: { email: "nouveau@example.mg", phone_number: "0340000000" },
    });
  });

  it("allows a partial payload (only one field)", async () => {
    await updateMe({ first_name: "Rakoto" });

    expect(apiFetch).toHaveBeenCalledWith("/users/me/", {
      method: "PATCH",
      body: { first_name: "Rakoto" },
    });
  });
});
