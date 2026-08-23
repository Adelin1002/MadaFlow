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
    def detect_duplicates(self, report_id: str, candidates: list[dict]) -> AIResult:
        """Identifie les signalements probablement liés au même événement (section 9)."""
        raise NotImplementedError

    @abstractmethod
    def analyze_image(self, image_url: str) -> AIResult:
        """Analyse le contenu d'une image jointe à un signalement."""
        raise NotImplementedError


def get_ai_provider() -> AIProvider:
    """
    Factory qui retourne l'implémentation configurée via AI_PROVIDER
    (settings). Le reste de l'application appelle uniquement cette fonction,
    jamais une classe concrète directement.
    """
    from django.conf import settings

    provider_name = settings.AI_PROVIDER

    if provider_name == "stub":
        from .stub import StubAIProvider
        return StubAIProvider()

    raise ValueError(f"AIProvider inconnu : {provider_name}")
