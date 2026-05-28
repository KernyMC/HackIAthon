import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from .core.config import get_settings
from .core.logging import setup_logging
from .core.db import check_db_connection
from .claims.router import router as claims_router
from .providers.router import router as providers_router
from .documents.router import router as documents_router
from .rag.router import router as rag_router
from .admin.router import router as admin_router
from .intake.router import router as intake_router

setup_logging()
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FraudIA API starting up...")
    db_ok = check_db_connection()
    logger.info(f"Database connection: {'OK' if db_ok else 'FAILED'}")
    yield
    logger.info("FraudIA API shutting down.")


app = FastAPI(
    title="FraudIA Claims API",
    description="API para detección de posible fraude en siniestros - Aseguradora del Sur",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(claims_router)
app.include_router(providers_router)
app.include_router(documents_router)
app.include_router(rag_router)
app.include_router(admin_router)
app.include_router(intake_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}")
    return JSONResponse(
        status_code=503,
        content={"error": "Base de datos no disponible. Configura AlloyDB para ver datos reales.", "detail": str(exc)[:200]},
    )


@app.get("/health")
def health():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "version": "1.0.0",
    }


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    answer: str
    tools_used: list
    citations: list


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    from .agent.claims_agent import run_agent
    from .core.db import SessionLocal
    import json

    db = SessionLocal()
    try:
        result = await run_agent(
            session_id=request.session_id,
            message=request.message,
            db=db,
        )
        _save_chat_message(db, request.session_id, "user", request.message, [], [])
        _save_chat_message(
            db,
            request.session_id,
            "assistant",
            result["answer"],
            result.get("tools_used", []),
            result.get("citations", []),
        )
        return ChatResponse(**result)
    finally:
        db.close()


def _save_chat_message(db, session_id: str, role: str, content: str, tools: list, citations: list):
    from sqlalchemy import text
    import json
    try:
        db.execute(
            text("""
                INSERT INTO app.chat_sessions (session_id, user_label)
                VALUES (:sid, :label)
                ON CONFLICT (session_id) DO NOTHING
            """),
            {"sid": session_id, "label": session_id},
        )
        db.execute(
            text("""
                INSERT INTO app.chat_messages
                    (session_id, role, content, tools_used, citations)
                VALUES (:sid, :role, :content, :tools, :cit)
            """),
            {
                "sid": session_id,
                "role": role,
                "content": content,
                "tools": json.dumps(tools),
                "cit": json.dumps(citations),
            },
        )
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to save chat message: {e}")
        db.rollback()
