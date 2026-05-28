from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Revisor(BaseModel):
    id_revisor: str
    nombre: str
    especialidad: str
    email: str
    casos_activos: int


class RevisionResult(BaseModel):
    id_siniestro: str
    estado_revision: str
    revisor: Revisor
    fecha_asignacion: datetime
    mensaje: str


class ColaRevisionItem(BaseModel):
    id_siniestro: str
    ramo: str
    ciudad: Optional[str]
    score_final: Optional[float]
    nivel_riesgo: Optional[str]
    estado_revision: str
    revisor_nombre: str
    revisor_especialidad: str
    fecha_asignacion: Optional[datetime]
    monto_reclamado: Optional[float]


class RevisionAccion(BaseModel):
    accion: str  # "aprobar" | "rechazar" | "reasignar"
    id_revisor_nuevo: Optional[str] = None  # solo para "reasignar"


class KanbanCard(BaseModel):
    id_siniestro: str
    ramo: str
    ciudad: Optional[str]
    score_final: Optional[float]
    nivel_riesgo: Optional[str]
    monto_reclamado: Optional[float]
    fecha_asignacion: Optional[datetime]
    dias_en_cola: int


class KanbanColumn(BaseModel):
    revisor: Revisor
    casos: list[KanbanCard]
