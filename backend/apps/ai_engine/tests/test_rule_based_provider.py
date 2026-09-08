from apps.ai_engine.providers.rule_based import RuleBasedAIProvider


class TestClassifyReport:
    def setup_method(self):
        self.provider = RuleBasedAIProvider()

    def test_matches_route_keywords(self):
        result = self.provider.classify_report(
            "Gros trou sur la route", "Nid-de-poule dangereux sur la chaussée principale"
        )
        assert result.result["category_guess"] == "route"
        assert result.confidence > 0

    def test_matches_dechets_keywords(self):
        result = self.provider.classify_report(
            "Décharge sauvage", "Des ordures s'accumulent près de la poubelle collective"
        )
        assert result.result["category_guess"] == "dechets"

    def test_matches_electricite_keywords(self):
        result = self.provider.classify_report(
            "Coupure de courant", "Panne électrique depuis hier, câble endommagé"
        )
        assert result.result["category_guess"] == "electricite"

    def test_falls_back_to_autre_when_no_keyword_matches(self):
        result = self.provider.classify_report("Bonjour", "Ceci est un test sans rapport")
        assert result.result["category_guess"] == "autre"
        assert result.confidence == 0.0

    def test_confidence_increases_with_more_matched_keywords(self):
        weak = self.provider.classify_report("Route", "un peu abîmée")
        strong = self.provider.classify_report(
            "Route endommagée", "Trou dans le bitume et chaussée fissurée, nid-de-poule visible"
        )
        assert strong.confidence >= weak.confidence


class TestSummarize:
    def setup_method(self):
        self.provider = RuleBasedAIProvider()

    def test_returns_first_sentence(self):
        text = "Un gros trou est apparu sur la route. Il est dangereux pour les motos. Merci d'intervenir."
        result = self.provider.summarize(text)
        assert result.result["summary"] == "Un gros trou est apparu sur la route."

    def test_truncates_very_long_single_sentence(self):
        text = "a " * 150  # pas de ponctuation, une seule "phrase" très longue
        result = self.provider.summarize(text)
        assert len(result.result["summary"]) <= 200


class TestDetectDuplicates:
    def setup_method(self):
        self.provider = RuleBasedAIProvider()

    def test_identical_nearby_text_scores_high(self):
        result = self.provider.detect_duplicates(
            "Gros trou dangereux sur la route principale",
            [{"id": "abc", "text": "Gros trou dangereux sur la route principale", "distance_m": 5}],
        )
        duplicates = result.result["duplicates"]
        assert duplicates[0]["score"] > 0.9

    def test_unrelated_far_text_scores_low(self):
        result = self.provider.detect_duplicates(
            "Gros trou dangereux sur la route",
            [{"id": "xyz", "text": "Coupure d'électricité dans le quartier nord", "distance_m": 149}],
        )
        duplicates = result.result["duplicates"]
        assert duplicates[0]["score"] < 0.3

    def test_results_sorted_by_score_descending(self):
        result = self.provider.detect_duplicates(
            "Fuite d'eau importante",
            [
                {"id": "far", "text": "Sujet totalement différent", "distance_m": 140},
                {"id": "close", "text": "Fuite d'eau importante détectée ici", "distance_m": 2},
            ],
        )
        scores = [d["score"] for d in result.result["duplicates"]]
        assert scores == sorted(scores, reverse=True)
        assert result.result["duplicates"][0]["id"] == "close"

    def test_no_candidates_returns_empty_list(self):
        result = self.provider.detect_duplicates("Un signalement quelconque", [])
        assert result.result["duplicates"] == []
        assert result.confidence is None

    def test_confidence_equals_top_score(self):
        result = self.provider.detect_duplicates("Test", [{"id": "a", "text": "Test", "distance_m": 0}])
        assert result.confidence == result.result["duplicates"][0]["score"]
