"""
Abstraction AIProvider (section 10 du cahier des charges).

Toute la logique métier (apps/reports, apps/scoring) doit dépendre de cette
interface, jamais d'un SDK IA concret. Cela permet de changer de fournisseur
(Anthropic, modèle interne, autre) sans toucher au reste de l'application.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AIResult:
    result: dict
    confidence: float | None
    provider_name: str


class AIProvider(ABC):
    """Interface commune à toutes les implémentations IA."""

    @abstractmethod
    def classify_report(self, title: str, description: str) -> AIResult:
        """Classifie automatiquement un signalement dans une catégorie."""
        raise NotImplementedError

    @abstractmethod
    def summarize(self, text: str) -> AIResult:
        """Produit un résumé automatique d'un texte."""
        raise NotImplementedError

    @abstractmethod
    def detect_duplicates(self, report_text: str, candidates: list[dict]) -> AIResult:
        """
        Identifie parmi `candidates` les signalements probablement liés au
        même événement que `report_text` (section 9).

        candidates : liste de dicts {"id": str, "text": str, "distance_m": float}
        déjà pré-filtrés géographiquement/temporellement par le service appelant
        (voir apps.ai_engine.services._nearby_candidates) — le provider n'a
        donc qu'à raisonner sur un petit ensemble de candidats plausibles.

        result attendu : {"duplicates": [{"id": ..., "score": 0.0, ...}, ...]}
        trié par score décroissant.
        """
        raise NotImplementedError

    @abstractmethod
    def analyze_image(self, image_url: str) -> AIResult:
        """Analyse le contenu d'une image jointe à un signalement."""
        raise NotImplementedError


def get_ai_provider() -> AIProvider:
    """
    Factory qui retourne l'implémentation configurée via AI_PROVIDER
    (settings). Le reste de l'application appelle uniquement cette fonction,
    jamais une classe concrète directement — c'est ce qui permet de changer
    de fournisseur sans réécrire apps.ai_engine.services ni apps.reports.
    """
    from django.conf import settings

    provider_name = settings.AI_PROVIDER

    if provider_name == "rule_based":
        from .rule_based import RuleBasedAIProvider

        return RuleBasedAIProvider()

    if provider_name == "anthropic":
        from .anthropic_provider import AnthropicAIProvider

        return AnthropicAIProvider(api_key=settings.ANTHROPIC_API_KEY)

    raise ValueError(
        f"AIProvider inconnu : {provider_name!r}. Valeurs possibles : 'rule_based', 'anthropic'."
    )
