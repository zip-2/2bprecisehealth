import pytest
from enum import Enum
from playwright.sync_api import APIRequestContext, sync_playwright

BASE_URL = "https://api.pharmgkb.org"

# Enum for valid clinical evidence levels
class EvidenceLevel(str, Enum):
    LEVEL_1A = "1A"
    LEVEL_1B = "1B"
    LEVEL_2A = "2A"
    LEVEL_2B = "2B"
    LEVEL_3 = "3"
    LEVEL_4 = "4"
    NA = "N/A"

@pytest.fixture(scope='session')
def api_context() -> APIRequestContext:
    """
    Create shared API context using base URL
    """
    playwright = sync_playwright().start()
    context = playwright.request.new_context(base_url=BASE_URL)
    yield context
    context.dispose()
    playwright.stop()

@pytest.mark.parametrize("gene_name", ["CYP2D6", "FAKEGENE123", "CYP2C19"])
class TestGeneAnnotations:
    def get_annotations(self, api_context: APIRequestContext, gene_name: str):
        """
        Helper function to retrieve annotations for a gene,
        with error handling for non-existent genes.
        """
        res = api_context.get(f'/v1/data/clinicalAnnotation?location.genes.symbol={gene_name}')
        if res.status == 404:
            pytest.fail(f"{gene_name}: Error - non-existent gene or variant")
        assert res.ok, f"Request failed: {res.status}"
        return res.json().get("data", [])

    def test_gene_has_clopidogrel(self, api_context: APIRequestContext, gene_name: str):
        """
        Verifies that a gene has at least one associated drug and logs level if Clopidogrel is present.
        Return error message if gene does not exist.
        """
        data = self.get_annotations(api_context, gene_name)

        assert len(data) > 0, f'No annotations found for {gene_name}'

        for entry in data:
            drugs = entry.get("chemicals", [])
            for drug in drugs:
                if "Clopidogrel" in drug.get("name", ""):
                    level = entry.get("levelOfEvidence") or entry.get('clinicalAnnotationLevel')
                    print(f'{gene_name} -> Clopidogrel found with level: {level}')
                    return
        assert False, f"{gene_name} → Clopidogrel not found"

    def test_gene_has_min_5_pediatric_drugs(self, api_context: APIRequestContext, gene_name: str):
        """
        Verifies that a gene has at least 5 pediatric clinical annotations.
        Return error message if gene does not exist.
        """
        data = self.get_annotations(api_context, gene_name)

        pediatric_count = sum(1 for entry in data if entry.get("pediatric") is True)
        assert pediatric_count >= 5, f'{gene_name}: Only {pediatric_count} pediatric drugs found'

    def test_gene_evidence_levels_valid(self, api_context: APIRequestContext, gene_name: str):
        """
        Validates that all annotations for a given gene have a valid evidence level.
        Return error message if gene does not exist.
        """
        data = self.get_annotations(api_context, gene_name)

        for entry in data:
            level_entry = entry.get("levelOfEvidence") or entry.get("clinicalAnnotationLevel")
            if isinstance(level_entry, dict):
                level = level_entry.get("term")
                assert level is not None, f"{gene_name}: Missing 'term' in evidence level object"
            else:
                assert False, f"{gene_name}: Evidence level entry is not a dict"
            assert level in EvidenceLevel._value2member_map_, f"{gene_name}: Invalid evidence level: {level}"
