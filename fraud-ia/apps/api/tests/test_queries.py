"""
Integration tests for FraudIA API — require a running database.
Run: pytest apps/api/tests/ -v
"""
import os
import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("ALLOYDB_HOST", "localhost") == "localhost"
    and os.environ.get("SKIP_DB_TESTS", "1") == "1",
    reason="Database not available in this environment",
)


@pytest.fixture(scope="session")
def db():
    from apps.api.app.core.db import SessionLocal, check_db_connection
    if not check_db_connection():
        pytest.skip("Database not reachable")
    session = SessionLocal()
    yield session
    session.close()


def test_kpis_returns_valid_structure(db):
    from apps.api.app.claims.repository import get_kpis
    kpis = get_kpis(db)
    assert "total_siniestros" in kpis
    assert "casos_verdes" in kpis
    assert "casos_rojos" in kpis
    assert kpis["total_siniestros"] >= 0


def test_list_siniestros_returns_items(db):
    from apps.api.app.claims.repository import list_siniestros
    result = list_siniestros(db, limit=10)
    assert "items" in result
    assert "total" in result
    assert isinstance(result["items"], list)


def test_list_siniestros_filter_by_nivel_riesgo(db):
    from apps.api.app.claims.repository import list_siniestros
    result = list_siniestros(db, nivel_riesgo="Rojo Alto", limit=10)
    for item in result["items"]:
        assert item["nivel_riesgo"] == "Rojo Alto"


def test_provider_risk_returns_list(db):
    from apps.api.app.providers.repository import get_provider_risk
    providers = get_provider_risk(db, limit=5)
    assert isinstance(providers, list)


def test_critical_documents_returns_list(db):
    from apps.api.app.documents.repository import get_critical_documents
    docs = get_critical_documents(db, limit=5)
    assert isinstance(docs, list)


def test_siniestro_detail_not_found(db):
    from apps.api.app.claims.repository import get_siniestro_detail
    result = get_siniestro_detail(db, "SIN-NONEXISTENT-00000")
    assert result is None
