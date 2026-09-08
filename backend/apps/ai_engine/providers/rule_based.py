"""
Implémentation par règles — sans appel réseau, sans coût, entièrement
déterministe et testable. C'est le fournisseur par défaut : il couvre le
besoin MVP "détection basique des doublons" (section 30) sans dépendre d'un
service externe. AnthropicAIProvider (voir anthropic_provider.py) peut la
remplacer pour la Phase 3 sans qu'aucun autre fichier n'ait à changer.
"""

import re

from .base import AIProvider, AIResult

# Mots-clés associés à chaque catégorie (slugs, voir apps.categories.fixtures).
# Volontairement simple et explicable : chaque décision peut être justifiée
# par la liste des mots-clés effectivement trouvés dans le texte.
CATEGORY_KEYWORDS = {
    "route": ["route", "trou", "nid-de-poule", "nid de poule", "bitume", "chaussée", "chaussee", "asphalte"],
    "circulation": ["circulation", "embouteillage", "bouchon", "feu rouge", "carrefour", "klaxon"],
    "transport": ["transport", "bus", "taxi-brousse", "taxi brousse", "gare", "arrêt", "arret"],
    "eclairage": [
        "éclairage",
        "eclairage",
        "lampadaire",
        "lumière",
        "lumiere",
        "ampoule",
        "obscurité",
        "obscurite",
    ],
    "dechets": ["déchet", "dechet", "ordure", "poubelle", "décharge", "decharge", "détritus", "detritus"],
    "eau": ["eau", "fuite", "robinet", "canalisation", "inondation", "égout", "egout"],
    "electricite": ["électricité", "electricite", "coupure", "câble", "cable", "transformateur", "panne"],
    "securite": [
        "sécurité",
        "securite",
        "vol",
        "agression",
        "insécurité",
        "insecurite",
        "violence",
        "cambriolage",
    ],
    "environnement": [
        "environnement",
        "pollution",
        "déforestation",
        "deforestation",
        "arbre",
        "fumée",
        "fumee",
    ],
    "infrastructure": ["infrastructure", "pont", "bâtiment", "batiment", "effondrement", "mur", "fissure"],
    "commerce": ["commerce", "marché", "marche", "boutique", "vendeur", "étal", "etal"],
}

_WORD_RE = re.compile(r"[a-zàâäéèêëïîôöùûüç]+", re.IGNORECASE)

# Rayon au-delà duquel la proximité géographique n'apporte plus aucun bonus
# au score de doublon (voir detect_duplicates).
PROXIMITY_DECAY_RADIUS_M = 150


def _tokenize(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower()))


class RuleBasedAIProvider(AIProvider):
    def classify_report(self, title: str, description: str) -> AIResult:
        text = f"{title} {description}".lower()
        scores: dict[str, list[str]] = {}
        for slug, keywords in CATEGORY_KEYWORDS.items():
            matched = [kw for kw in keywords if kw in text]
            if matched:
                scores[slug] = matched

        if not scores:
            return AIResult(
                result={"category_guess": "autre", "matched_keywords": []},
                confidence=0.0,
                provider_name="rule_based",
            )

        best_slug = max(scores, key=lambda slug: len(scores[slug]))
        matched = scores[best_slug]
        # 3 mots-clés distincts trouvés = confiance maximale.
        confidence = round(min(1.0, len(matched) / 3), 2)

        return AIResult(
            result={"category_guess": best_slug, "matched_keywords": matched},
            confidence=confidence,
            provider_name="rule_based",
        )

    def summarize(self, text: str) -> AIResult:
        text = text.strip()
        sentences = re.split(r"(?<=[.!?])\s+", text)
        summary = sentences[0] if sentences and sentences[0] else text[:140]
        if len(summary) > 200:
            summary = summary[:197] + "..."
        return AIResult(result={"summary": summary}, confidence=None, provider_name="rule_based")

    def detect_duplicates(self, report_text: str, candidates: list[dict]) -> AIResult:
        ref_tokens = _tokenize(report_text)
        results = []

        for candidate in candidates:
            cand_tokens = _tokenize(candidate.get("text", ""))
            if ref_tokens and cand_tokens:
                intersection = ref_tokens & cand_tokens
                union = ref_tokens | cand_tokens
                similarity = len(intersection) / len(union) if union else 0.0
            else:
                similarity = 0.0

            distance_m = candidate.get("distance_m", PROXIMITY_DECAY_RADIUS_M)
            proximity = max(0.0, 1 - (distance_m / PROXIMITY_DECAY_RADIUS_M))

            score = round(0.7 * similarity + 0.3 * proximity, 3)
            results.append(
                {
                    "id": candidate["id"],
                    "score": score,
                    "text_similarity": round(similarity, 3),
                    "proximity_score": round(proximity, 3),
                }
            )

        results.sort(key=lambda r: r["score"], reverse=True)
        top_score = results[0]["score"] if results else None

        return AIResult(
            result={"duplicates": results},
            confidence=top_score,
            provider_name="rule_based",
        )

    def analyze_image(self, image_url: str) -> AIResult:
        return AIResult(
            result={"labels": [], "note": "Analyse d'image non disponible avec le fournisseur rule_based."},
            confidence=None,
            provider_name="rule_based",
        )
