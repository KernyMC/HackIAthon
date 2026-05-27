#!/usr/bin/env python3
"""
Smoke test for the FraudIA API. Tests all critical endpoints.
"""
import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

try:
    import httpx
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "httpx"], check=True)
    import httpx

BASE_URL = os.environ.get("API_URL", "http://localhost:8080")
PASS = 0
FAIL = 0


def check(name: str, condition: bool, detail: str = ""):
    global PASS, FAIL
    if condition:
        logger.info(f"  PASS: {name}")
        PASS += 1
    else:
        logger.error(f"  FAIL: {name} — {detail}")
        FAIL += 1


def test_health():
    r = httpx.get(f"{BASE_URL}/health", timeout=10)
    check("GET /health status 200", r.status_code == 200)
    data = r.json()
    check("health.status in ok/degraded", data.get("status") in ("ok", "degraded"))


def test_kpis():
    r = httpx.get(f"{BASE_URL}/api/kpis", timeout=10)
    check("GET /api/kpis status 200", r.status_code == 200)
    data = r.json()
    check("kpis.total_siniestros > 0", data.get("total_siniestros", 0) > 0,
          f"got {data.get('total_siniestros')}")
    check("kpis has casos_rojos", "casos_rojos" in data)


def test_siniestros():
    r = httpx.get(f"{BASE_URL}/api/siniestros?limit=5", timeout=10)
    check("GET /api/siniestros status 200", r.status_code == 200)
    data = r.json()
    check("siniestros has items", len(data.get("items", [])) > 0)
    check("siniestros has total", data.get("total", 0) > 0)
    if data.get("items"):
        item = data["items"][0]
        check("item has id_siniestro", "id_siniestro" in item)
        check("item has score_final", "score_final" in item)


def test_siniestro_detail():
    r = httpx.get(f"{BASE_URL}/api/siniestros?limit=1", timeout=10)
    if r.status_code != 200 or not r.json().get("items"):
        check("GET /api/siniestros/{id} skipped", False, "no siniestros found")
        return
    sin_id = r.json()["items"][0]["id_siniestro"]
    r2 = httpx.get(f"{BASE_URL}/api/siniestros/{sin_id}", timeout=10)
    check(f"GET /api/siniestros/{sin_id} status 200", r2.status_code == 200)
    data = r2.json()
    check("detail has documentos", "documentos" in data)


def test_proveedores():
    r = httpx.get(f"{BASE_URL}/api/proveedores/riesgo?limit=5", timeout=10)
    check("GET /api/proveedores/riesgo status 200", r.status_code == 200)
    data = r.json()
    check("proveedores is list", isinstance(data, list))
    check("proveedores count > 0", len(data) > 0)


def test_documentos():
    r = httpx.get(f"{BASE_URL}/api/documentos/criticos?limit=5", timeout=10)
    check("GET /api/documentos/criticos status 200", r.status_code == 200)


def test_rag():
    r = httpx.get(f"{BASE_URL}/api/rag/search?query=fraude+riesgo&top_k=3", timeout=20)
    check("GET /api/rag/search status 200", r.status_code == 200)
    data = r.json()
    check("rag has results key", "results" in data)


def test_chat():
    payload = {"session_id": "smoke-test-001", "message": "¿Cuáles son los 5 siniestros con mayor riesgo?"}
    r = httpx.post(f"{BASE_URL}/api/chat", json=payload, timeout=60)
    check("POST /api/chat status 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
    data = r.json()
    check("chat has answer", bool(data.get("answer")))
    check("chat has tools_used", "tools_used" in data)


def main():
    logger.info(f"=== Smoke Test: {BASE_URL} ===")
    tests = [test_health, test_kpis, test_siniestros, test_siniestro_detail,
             test_proveedores, test_documentos, test_rag, test_chat]

    for test in tests:
        try:
            test()
        except Exception as e:
            global FAIL
            FAIL += 1
            logger.error(f"  EXCEPTION in {test.__name__}: {e}")

    logger.info(f"\n=== Results: {PASS} passed, {FAIL} failed ===")
    sys.exit(0 if FAIL == 0 else 1)


if __name__ == "__main__":
    main()
