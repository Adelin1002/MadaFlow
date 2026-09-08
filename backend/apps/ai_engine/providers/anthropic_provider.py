"""
Implémentation utilisant l'API Anthropic (section 10 — Phase 3 de la
roadmap : "IA, détection des doublons, analyse d'images, prédictions").

IMPORTANT — honnêteté sur ce qui a été validé :
Ce fichier a été écrit et relu avec soin, mais n'a jamais été exécuté contre
la vraie API Anthropic dans cet environnement de génération (pas de clé API
fournie, et il n'était pas question d'en consommer une sans ton accord
explicite). Les tests de apps/ai_engine/tests/test_anthropic_provider.py
vérifient uniquement la logique de parsing/erreur via un client simulé
(mock) — pas d'appel réseau réel. Avant mise en production, teste-le une
fois avec une vraie clé (ANTHROPIC_API_KEY dans .env, AI_PROVIDER=anthropic)
sur quelques signalements réels.
"""

import json

from anthropic import Anthropic

from .base import AIProvider, AIResult

# Modèle utilisé pour tous les appels serveur de MadaFlow.
MODEL = "claude-sonnet-4-6"

_CATEGORY_SLUGS = (
    "route",
    "circulation",
    "transport",
    "eclairage",
    "dechets",
    "eau",
    "electricite",
    "securite",
    "environnement",
    "infrastructure",
    "commerce",
    "autre",
)


class AnthropicAIProvider(AIProvider):
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY est requis pour utiliser AnthropicAIProvider. "
                "Configure-le dans .env, ou repasse AI_PROVIDER=rule_based."
            )
        self._client = Anthropic(api_key=api_key)

    def _ask_json(self, prompt: str) -> dict:
        response = self._client.messages.create(
            model=MODEL,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            text = text.rsplit("```", 1)[0]
        return json.loads(text.strip())

    def classify_report(self, title: str, description: str) -> AIResult:
        prompt = (
            "Tu classes un signalement citoyen malgache dans une catégorie.\n"
            f"Catégories possibles : {', '.join(_CATEGORY_SLUGS)}.\n\n"
            f"Titre : {title}\n"
            f"Description : {description}\n\n"
            "Réponds uniquement en JSON strict, sans aucun texte autour : "
            '{"category_guess": "...", "confidence": 0.0, "reason": "..."}'
        )
        data = self._ask_json(prompt)
        return AIResult(
            result={
                "category_guess": data.get("category_guess", "autre"),
                "reason": data.get("reason", ""),
            },
            confidence=data.get("confidence"),
            provider_name="anthropic",
        )

    def summarize(self, text: str) -> AIResult:
        prompt = (
            "Résume ce signalement citoyen en une phrase claire et neutre, en français, "
            "sans inventer de détails absents du texte original.\n\n"
            f"Texte : {text}\n\n"
            'Réponds uniquement en JSON strict : {"summary": "..."}'
        )
        data = self._ask_json(prompt)
        return AIResult(
            result={"summary": data.get("summary", "")},
            confidence=None,
            provider_name="anthropic",
        )

    def detect_duplicates(self, report_text: str, candidates: list[dict]) -> AIResult:
        if not candidates:
            return AIResult(result={"duplicates": []}, confidence=None, provider_name="anthropic")

        candidates_desc = "\n".join(
            f'- id={c["id"]} (à {c.get("distance_m", "?")}m) : {c["text"]}' for c in candidates
        )
        prompt = (
            "Un citoyen malgache signale un problème urbain. Détermine lesquels des "
            "signalements existants ci-dessous décrivent probablement le même événement "
            "réel (même problème, même lieu), même si le texte diffère.\n\n"
            f"Nouveau signalement : {report_text}\n\n"
            f"Signalements existants à proximité :\n{candidates_desc}\n\n"
            "Réponds uniquement en JSON strict, trié par score décroissant (0.0 à 1.0) : "
            '{"duplicates": [{"id": "...", "score": 0.0, "reason": "..."}]}'
        )
        data = self._ask_json(prompt)
        duplicates = data.get("duplicates", [])
        top_score = duplicates[0]["score"] if duplicates else None
        return AIResult(
            result={"duplicates": duplicates},
            confidence=top_score,
            provider_name="anthropic",
        )

    def analyze_image(self, image_url: str) -> AIResult:
        raise NotImplementedError(
            "L'analyse d'image nécessite l'envoi de l'image encodée au modèle "
            "(voir la documentation Anthropic sur les blocs 'image') — non "
            "implémenté à cette étape, hors périmètre MVP (section 30)."
        )
