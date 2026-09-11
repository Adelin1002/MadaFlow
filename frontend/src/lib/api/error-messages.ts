import { ApiError } from "./client";

/**
 * DRF renvoie soit {"detail": "..."} (erreur générique), soit un dict
 * champ -> liste de messages (erreurs de validation 400). On normalise les
 * deux formes pour l'affichage dans un formulaire.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const { detail, ...fields } = error.body;
  void detail;
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fields)) {
    if (Array.isArray(messages)) {
      result[field] = messages.join(" ");
    } else if (typeof messages === "string") {
      result[field] = messages;
    }
  }
  return result;
}

export function getGeneralError(error: unknown): string | null {
  if (error instanceof ApiError) {
    // Le backend traduit déjà ses messages génériques en français
    // (LANGUAGE_CODE="fr-fr", vérifié contre le vrai serveur) — on affiche
    // error.body.detail tel quel plutôt que de le remplacer.
    if (error.body.detail) return error.body.detail;
    if (Object.keys(error.body).length === 0) {
      return "Une erreur est survenue. Réessayez.";
    }
    return null; // erreurs de champ gérées séparément par getFieldErrors
  }
  return "Impossible de contacter le serveur. Vérifiez votre connexion.";
}
