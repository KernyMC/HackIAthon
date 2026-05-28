# apps/api/app/intake/router.py
import json
import logging
import uuid
from datetime import date
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from ..core.db import get_db
from .schemas import NuevoSiniestroInput, EvaluacionResult
from .scoring import calcular_score, clasificar, ACCION_POR_NIVEL
from .pdf_ingester import extraer_texto_pdf, ingestar_en_rag

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["intake"])

RAMOS = ["Automóvil", "Salud", "Vida", "Hogar", "Responsabilidad Civil", "Robo"]


def _generar_id() -> str:
    return f"SIN-EVAL-{uuid.uuid4().hex[:6].upper()}"


def _get_id_proveedor(db: Session, nombre: str) -> Optional[str]:
    row = db.execute(
        text("SELECT id_proveedor FROM claims.proveedores WHERE LOWER(nombre_proveedor) ILIKE :n LIMIT 1"),
        {"n": f"%{nombre.lower()}%"},
    ).first()
    return row[0] if row else None


def _proveedor_restringido(db: Session, nombre: str) -> bool:
    """Check if provider name fuzzy-matches a restricted provider in DB."""
    row = db.execute(
        text("""
            SELECT 1 FROM claims.proveedores
            WHERE en_lista_restrictiva = TRUE
              AND LOWER(nombre_proveedor) ILIKE :nombre
            LIMIT 1
        """),
        {"nombre": f"%{nombre.lower()}%"},
    ).first()
    return row is not None


@router.post("/siniestros/evaluar", response_model=EvaluacionResult)
async def evaluar_siniestro(
    ramo: str = Form(...),
    ciudad: str = Form(...),
    monto_reclamado: float = Form(...),
    descripcion: str = Form(...),
    nombre_proveedor: str = Form(...),
    dias_desde_inicio_poliza: Optional[int] = Form(None),
    dias_entre_ocurrencia_reporte: Optional[int] = Form(None),
    documentos_completos: bool = Form(True),
    pdf_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if ramo not in RAMOS:
        raise HTTPException(status_code=422, detail=f"Ramo inválido. Opciones: {RAMOS}")

    data = NuevoSiniestroInput(
        ramo=ramo,
        ciudad=ciudad,
        monto_reclamado=monto_reclamado,
        descripcion=descripcion,
        nombre_proveedor=nombre_proveedor,
        dias_desde_inicio_poliza=dias_desde_inicio_poliza,
        dias_entre_ocurrencia_reporte=dias_entre_ocurrencia_reporte,
        documentos_completos=documentos_completos,
    )

    id_proveedor = _get_id_proveedor(db, nombre_proveedor)
    restringido = _proveedor_restringido(db, nombre_proveedor)
    score_reglas, alertas = calcular_score(data, restringido)
    score_modelo_simulado = 50.0
    score_final = round(0.6 * score_reglas + 0.4 * score_modelo_simulado, 1)
    nivel = clasificar(score_final)

    doc_id = None
    msg_doc = None

    if pdf_file and pdf_file.filename:
        try:
            pdf_bytes = await pdf_file.read()
            if len(pdf_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="PDF demasiado grande (máx 10 MB)")
            texto = await extraer_texto_pdf(pdf_bytes)
            doc_id = ingestar_en_rag(db, texto, pdf_file.filename)
            msg_doc = f"Documento '{pdf_file.filename}' indexado. Puedes preguntarle al agente sobre este peritaje."
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"PDF ingestion failed: {e}")
            msg_doc = "El documento no pudo indexarse, pero el score fue calculado."

    # Persist the evaluated claim to claims.siniestros so it appears in the dashboard
    id_siniestro = _generar_id()
    try:
        db.execute(
            text("""
                INSERT INTO claims.siniestros (
                    id_siniestro, id_proveedor, ramo, ciudad,
                    fecha_ocurrencia, fecha_reporte,
                    monto_reclamado, descripcion, documentos_completos,
                    dias_desde_inicio_poliza, dias_entre_ocurrencia_reporte,
                    proveedor_en_lista_restrictiva,
                    score_reglas, score_modelo_simulado, score_final,
                    nivel_riesgo, alertas_activadas, accion_sugerida,
                    estado, perfil_riesgo_generacion
                ) VALUES (
                    :id, :id_proveedor, :ramo, :ciudad,
                    :fecha_hoy, :fecha_hoy,
                    :monto, :descripcion, :docs_completos,
                    :dias_inicio, :dias_reporte,
                    :restringido,
                    :score_reglas, :score_modelo, :score_final,
                    :nivel, CAST(:alertas AS jsonb), :accion,
                    'En revisión', 'ingreso_manual'
                )
            """),
            {
                "id": id_siniestro,
                "id_proveedor": id_proveedor,
                "ramo": ramo,
                "ciudad": ciudad,
                "fecha_hoy": date.today(),
                "monto": monto_reclamado,
                "descripcion": descripcion,
                "docs_completos": documentos_completos,
                "dias_inicio": dias_desde_inicio_poliza,
                "dias_reporte": dias_entre_ocurrencia_reporte,
                "restringido": restringido,
                "score_reglas": round(score_reglas, 1),
                "score_modelo": score_modelo_simulado,
                "score_final": score_final,
                "nivel": nivel,
                "alertas": json.dumps(alertas, ensure_ascii=False),
                "accion": ACCION_POR_NIVEL[nivel],
            },
        )
        db.commit()
        logger.info(f"New claim persisted: {id_siniestro}")
    except Exception as e:
        logger.error(f"Failed to persist claim: {e}")
        db.rollback()

    return EvaluacionResult(
        id_siniestro=id_siniestro,
        score_reglas=round(score_reglas, 1),
        score_final=score_final,
        nivel_riesgo=nivel,
        alertas=alertas,
        accion_sugerida=ACCION_POR_NIVEL[nivel],
        proveedor_restringido=restringido,
        documento_indexado=doc_id,
        mensaje_documento=msg_doc,
    )
