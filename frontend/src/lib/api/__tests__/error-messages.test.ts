import { describe, it, expect } from "vitest";
import { ApiError } from "../client";
import { getFieldErrors, getGeneralError } from "../error-messages";

// Les corps d'erreur ci-dessous sont des réponses RÉELLES capturées contre
// le backend Django en cours d'exécution (voir historique de génération),
// pas des suppositions sur le format DRF.

describe("getFieldErrors", () => {
  it("parses a single-field validation error (username already taken)", () => {
    const error = new ApiError(400, { username: ["Un utilisateur avec ce nom existe déjà."] });
    expect(getFieldErrors(error)).toEqual({ username: "Un utilisateur avec ce nom existe déjà." });
  });

  it("parses a password mismatch error", () => {
    const error = new ApiError(400, { password2: ["Les mots de passe ne correspondent pas."] });
    expect(getFieldErrors(error)).toEqual({ password2: "Les mots de passe ne correspondent pas." });
  });

  it("joins multiple messages for the same field", () => {
    const error = new ApiError(400, { password: ["Trop courant.", "Trop court."] });
    expect(getFieldErrors(error)).toEqual({ password: "Trop courant. Trop court." });
  });

  it("ignores the detail key (handled separately by getGeneralError)", () => {
    const error = new ApiError(401, {
      detail: "Aucun compte actif n'a été trouvé avec les identifiants fournis",
    });
    expect(getFieldErrors(error)).toEqual({});
  });

  it("returns an empty object for non-ApiError values", () => {
    expect(getFieldErrors(new Error("network down"))).toEqual({});
  });
});

describe("getGeneralError", () => {
  it("surfaces the backend's own French detail message unchanged", () => {
    const error = new ApiError(401, {
      detail: "Aucun compte actif n'a été trouvé avec les identifiants fournis",
    });
    expect(getGeneralError(error)).toBe(
      "Aucun compte actif n'a été trouvé avec les identifiants fournis",
    );
  });

  it("returns a generic fallback for an empty error body", () => {
    const error = new ApiError(500, {});
    expect(getGeneralError(error)).toBe("Une erreur est survenue. Réessayez.");
  });

  it("returns null when only field errors are present, deferring to getFieldErrors", () => {
    const error = new ApiError(400, { username: ["Un utilisateur avec ce nom existe déjà."] });
    expect(getGeneralError(error)).toBeNull();
  });

  it("returns a connectivity message for non-ApiError failures", () => {
    expect(getGeneralError(new TypeError("Failed to fetch"))).toBe(
      "Impossible de contacter le serveur. Vérifiez votre connexion.",
    );
  });
});
