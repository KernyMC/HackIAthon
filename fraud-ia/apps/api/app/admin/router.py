import subprocess
import sys
import logging
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


class AdminResponse(BaseModel):
    status: str
    message: str


def _run_script(script_path: str):
    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            logger.error(f"Script {script_path} failed: {result.stderr}")
        else:
            logger.info(f"Script {script_path} completed: {result.stdout[-500:]}")
    except Exception as e:
        logger.error(f"Script {script_path} exception: {e}")


@router.post("/bootstrap-db", response_model=AdminResponse)
def bootstrap_db(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_script, "scripts/bootstrap_database.py")
    return AdminResponse(
        status="started",
        message="Bootstrap iniciado en background. Revisa los logs.",
    )


@router.post("/load-data", response_model=AdminResponse)
def load_data(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_script, "scripts/load_csv_to_alloydb.py")
    return AdminResponse(
        status="started",
        message="Carga de datos iniciada en background. Revisa los logs.",
    )


@router.post("/reindex-rag", response_model=AdminResponse)
def reindex_rag(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_script, "scripts/ingest_business_docs.py")
    return AdminResponse(
        status="started",
        message="Indexación RAG iniciada en background. Revisa los logs.",
    )
