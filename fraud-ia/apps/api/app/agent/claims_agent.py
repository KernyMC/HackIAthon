"""
FraudIA Claims Agent using Google ADK.
"""
import logging
import json
from typing import Any
from .instructions import AGENT_INSTRUCTIONS
from .tools import (
    buscar_conocimiento_negocio,
    listar_siniestros_mayor_riesgo,
    explicar_siniestro,
    analizar_proveedores_alertas,
    listar_documentos_faltantes_casos_criticos,
    listar_casos_cerca_inicio_poliza,
    generar_resumen_ejecutivo,
    listar_narrativas_similares,
)

logger = logging.getLogger(__name__)

TOOLS = [
    buscar_conocimiento_negocio,
    listar_siniestros_mayor_riesgo,
    explicar_siniestro,
    analizar_proveedores_alertas,
    listar_documentos_faltantes_casos_criticos,
    listar_casos_cerca_inicio_poliza,
    generar_resumen_ejecutivo,
    listar_narrativas_similares,
]

_agent = None


def _get_agent():
    global _agent
    if _agent is not None:
        return _agent

    try:
        from google.adk.agents import Agent
        from ..core.config import get_settings

        settings = get_settings()
        _agent = Agent(
            name="fraudia_claims_assistant",
            model=settings.gemini_model,
            description="Agente de análisis de posible fraude en siniestros de seguros.",
            instruction=AGENT_INSTRUCTIONS,
            tools=TOOLS,
        )
        logger.info("ADK Agent initialized successfully")
    except Exception as e:
        logger.warning(f"ADK Agent init failed: {e}. Using fallback.")
        _agent = None
    return _agent


async def run_agent(
    session_id: str, message: str, db=None
) -> dict:
    """
    Run the agent for a given user message. Returns answer + metadata.
    """
    agent = _get_agent()

    if agent is not None:
        return await _run_adk_agent(agent, session_id, message, db)
    else:
        return await _run_fallback_agent(session_id, message, db)


async def _run_adk_agent(agent, session_id: str, message: str, db) -> dict:
    try:
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        from google.genai.types import Content, Part

        session_service = InMemorySessionService()
        runner = Runner(
            agent=agent,
            app_name="fraudia",
            session_service=session_service,
        )
        session = await session_service.create_session(
            app_name="fraudia",
            user_id=session_id,
            session_id=session_id,
        )

        user_content = Content(role="user", parts=[Part(text=message)])
        tools_used = []
        answer = ""

        async for event in runner.run_async(
            user_id=session_id,
            session_id=session_id,
            new_message=user_content,
        ):
            if hasattr(event, "content") and event.content:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        answer = part.text
                    if hasattr(part, "function_call") and part.function_call:
                        tools_used.append(part.function_call.name)

        return {
            "answer": answer or "No se pudo generar una respuesta.",
            "tools_used": tools_used,
            "citations": _build_citations(tools_used),
        }
    except Exception as e:
        logger.error(f"ADK agent error: {e}")
        return await _run_fallback_agent(session_id, message, db)


async def _run_fallback_agent(session_id: str, message: str, db) -> dict:
    """
    Fallback: use Gemini directly with tool dispatching based on message keywords.
    """
    from ..core.config import get_settings

    settings = get_settings()

    tool_result = _dispatch_tool_by_keyword(message)
    tool_name = tool_result.get("tool", "buscar_conocimiento_negocio")

    context = json.dumps(tool_result, ensure_ascii=False, default=str)[:4000]

    prompt = f"""
{AGENT_INSTRUCTIONS}

Pregunta del analista: {message}

Datos recuperados por herramienta '{tool_name}':
{context}

Responde en español de manera clara y profesional para un analista de seguros.
"""
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        vertexai.init(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
        )
        model = GenerativeModel(settings.gemini_model)
        response = model.generate_content(prompt)
        answer = response.text
    except Exception as e:
        logger.error(f"Gemini fallback error: {e}")
        answer = _format_tool_result_as_text(tool_result)

    return {
        "answer": answer,
        "tools_used": [tool_name],
        "citations": _build_citations([tool_name]),
    }


def _dispatch_tool_by_keyword(message: str) -> dict:
    msg_lower = message.lower()

    if any(k in msg_lower for k in ["narrativa", "similar", "fraude coordinado", "taller cómplice", "taller complice", "clonada", "rf-07", "rf07", "anillo"]):
        return listar_narrativas_similares()
    elif any(k in msg_lower for k in ["proveedor", "taller", "clínica", "clinica"]):
        return analizar_proveedores_alertas()
    elif any(k in msg_lower for k in ["documento", "faltante", "inconsistente", "legible"]):
        return listar_documentos_faltantes_casos_criticos()
    elif any(k in msg_lower for k in ["inicio", "vigencia", "reciente", "días desde"]):
        return listar_casos_cerca_inicio_poliza()
    elif any(k in msg_lower for k in ["resumen", "ejecutivo", "kpi", "hallazgo"]):
        return generar_resumen_ejecutivo()
    elif any(k in msg_lower for k in ["sin-", "siniestro-", "caso específico", "explica el"]):
        import re
        match = re.search(r"sin-\d+", msg_lower)
        if match:
            return explicar_siniestro(match.group(0).upper())
        return listar_siniestros_mayor_riesgo()
    elif any(k in msg_lower for k in ["top", "mayor riesgo", "más alto", "peores casos", "10 siniest"]):
        return listar_siniestros_mayor_riesgo()
    else:
        return buscar_conocimiento_negocio(message)


def _build_citations(tools_used: list) -> list:
    citation_map = {
        "buscar_conocimiento_negocio": {"type": "rag", "source": "rag.business_chunks"},
        "listar_siniestros_mayor_riesgo": {"type": "sql_view", "source": "claims.siniestros"},
        "explicar_siniestro": {"type": "sql", "source": "claims.v_siniestros_enriched"},
        "analizar_proveedores_alertas": {"type": "sql_view", "source": "claims.v_provider_risk"},
        "listar_documentos_faltantes_casos_criticos": {"type": "sql", "source": "claims.documentos"},
        "listar_casos_cerca_inicio_poliza": {"type": "sql", "source": "claims.siniestros"},
        "generar_resumen_ejecutivo": {"type": "sql_view", "source": "claims.v_kpis"},
        "listar_narrativas_similares": {"type": "sql", "source": "claims.narrativas_similares"},
    }
    return [citation_map[t] for t in tools_used if t in citation_map]


def _format_tool_result_as_text(result: dict) -> str:
    if "error" in result:
        return f"No se pudo obtener la información: {result['error']}"
    if "siniestros" in result:
        items = result["siniestros"][:5]
        lines = [f"- {s.get('id_siniestro')} | Score: {s.get('score_final')} | {s.get('nivel_riesgo')}" for s in items]
        return "Siniestros con mayor riesgo:\n" + "\n".join(lines)
    if "proveedores" in result:
        items = result["proveedores"][:5]
        lines = [f"- {p.get('nombre_proveedor')} | Casos rojos: {p.get('casos_rojos')}" for p in items]
        return "Proveedores con más alertas:\n" + "\n".join(lines)
    return json.dumps(result, ensure_ascii=False, default=str)[:1000]
