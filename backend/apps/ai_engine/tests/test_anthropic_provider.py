"""
Aucun de ces tests n'effectue d'appel réseau réel vers l'API Anthropic :
le client SDK est systématiquement mocké. Ils valident uniquement la
logique de construction du prompt / parsing JSON / gestion d'erreur.
Voir la docstring de apps/ai_engine/providers/anthropic_provider.py pour
le rappel de ce qui n'a PAS été testé en conditions réelles.
"""

from unittest.mock import Mock

import pytest

from apps.ai_engine.providers.anthropic_provider import AnthropicAIProvider


class FakeTextBlock:
    def __init__(self, text):
        self.type = "text"
        self.text = text


class FakeResponse:
    def __init__(self, text):
        self.content = [FakeTextBlock(text)]


def _provider_with_mocked_client(response_text: str) -> AnthropicAIProvider:
    provider = AnthropicAIProvider(api_key="sk-ant-fake-key-for-tests-only")
    provider._client = Mock()
    provider._client.messages.create = Mock(return_value=FakeResponse(response_text))
    return provider


class TestInitialization:
    def test_raises_without_api_key(self):
        with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
            AnthropicAIProvider(api_key="")


class TestClassifyReport:
    def test_parses_valid_json_response(self):
        provider = _provider_with_mocked_client(
            '{"category_guess": "route", "confidence": 0.92, "reason": "mention explicite de nid-de-poule"}'
        )
        result = provider.classify_report("Trou dans la route", "Nid-de-poule dangereux")
        assert result.result["category_guess"] == "route"
        assert result.confidence == 0.92
        assert result.provider_name == "anthropic"

    def test_strips_markdown_code_fences(self):
        provider = _provider_with_mocked_client(
            '```json\n{"category_guess": "eau", "confidence": 0.8, "reason": "fuite"}\n```'
        )
        result = provider.classify_report("Fuite d'eau", "Ça coule depuis 3 jours")
        assert result.result["category_guess"] == "eau"

    def test_missing_category_guess_defaults_to_autre(self):
        provider = _provider_with_mocked_client('{"confidence": 0.1, "reason": "incertain"}')
        result = provider.classify_report("???", "???")
        assert result.result["category_guess"] == "autre"


class TestSummarize:
    def test_parses_summary(self):
        provider = _provider_with_mocked_client('{"summary": "Un trou dangereux signalé sur la route."}')
        result = provider.summarize("Il y a un gros trou sur la route depuis hier, c'est dangereux.")
        assert result.result["summary"] == "Un trou dangereux signalé sur la route."


class TestDetectDuplicates:
    def test_returns_empty_without_calling_api_when_no_candidates(self):
        provider = _provider_with_mocked_client("")  # ne doit jamais être appelé
        result = provider.detect_duplicates("Un signalement", [])
        assert result.result["duplicates"] == []
        provider._client.messages.create.assert_not_called()

    def test_parses_duplicates_list(self):
        provider = _provider_with_mocked_client(
            '{"duplicates": [{"id": "abc", "score": 0.9, "reason": "même problème, même lieu"}]}'
        )
        result = provider.detect_duplicates(
            "Gros trou dangereux",
            [{"id": "abc", "text": "Nid-de-poule signalé", "distance_m": 10}],
        )
        assert result.result["duplicates"][0]["id"] == "abc"
        assert result.confidence == 0.9


class TestAnalyzeImage:
    def test_not_implemented(self):
        provider = _provider_with_mocked_client("")
        with pytest.raises(NotImplementedError):
            provider.analyze_image("https://example.mg/photo.jpg")
