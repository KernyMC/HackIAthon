# apps/api/app/intake/schemas.py
from pydantic import BaseModel, Field
from typing import Optional


class NuevoSiniestroInput(BaseModel):
    ramo: str = Field(..., description="Ramo del seguro: Automóvil, Salud, Vida, Hogar, Robo")
    ciudad: str
    monto_reclamado: float = Field(..., gt=0)
    descripcion: str = Field(..., min_length=10)
    nombre_proveedor: str
    dias_desde_inicio_poliza: Optional[int] = Field(None, ge=0)
    dias_entre_ocurrencia_reporte: Optional[int] = Field(None, ge=0)
    documentos_completos: bool = True


class EvaluacionResult(BaseModel):
    id_siniestro: str
    score_reglas: float
    score_final: float
    nivel_riesgo: str          # Verde Bajo | Amarillo Medio | Rojo Alto
    alertas: list[str]
    accion_sugerida: str
    proveedor_restringido: bool
    documento_indexado: Optional[str] = None   # doc_id si se subió PDF
    mensaje_documento: Optional[str] = None
