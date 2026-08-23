"""
Implémentation de secours utilisée en développement / avant l'intégration
d'un vrai fournisseur IA (Phase 3 de la roadmap). Ne doit jamais présenter
ses résultats comme des données réelles — voir AIAnalysis.data_source.
"""
from .base import AIProvider, AIResult


class StubAIProvider(AIProvider):
    def classify_report(self, title: str, description: str) -> AIResult:
        return AIResult(
            result={"category_guess": "autre", "note": "stub — non entraîné"},
            confidence=None,
            provider_name="stub",
        )

    def summarize(self, text: str) -> AIResult:
        return AIResult(
            result={"summary": text[:140]},
            confidence=None,
            provider_name="stub",
        )

    def detect_duplicates(self, report_id: str, candidates: list[dict]) -> AIResult:
        return AIResult(
            result={"duplicates": [], "note": "stub — aucune détection réelle"},
            confidence=None,
            provider_name="stub",
        )

    def analyze_image(self, image_url: str) -> AIResult:
        return AIResult(
            result={"labels": [], "note": "stub — non implémenté"},
            confidence=None,
            provider_name="stub",
        )
