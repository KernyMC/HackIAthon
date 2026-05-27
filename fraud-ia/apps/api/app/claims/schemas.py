from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
from decimal import Decimal


class SiniestroBase(BaseModel):
    id_siniestro: str
    id_poliza: Optional[str] = None
    id_asegurado: Optional[str] = None
    id_vehiculo: Optional[str] = None
    id_conductor: Optional[str] = None
    id_proveedor: Optional[str] = None
    ramo: Optional[str] = None
    cobertura: Optional[str] = None
    ciudad: Optional[str] = None
    sucursal: Optional[str] = None
    estado: Optional[str] = None
    fecha_ocurrencia: Optional[date] = None
    fecha_reporte: Optional[date] = None
    monto_reclamado: Optional[Decimal] = None
    monto_estimado: Optional[Decimal] = None
    monto_pagado: Optional[Decimal] = None
    suma_asegurada: Optional[Decimal] = None
    descripcion: Optional[str] = None
    documentos_completos: Optional[bool] = None
    dias_desde_inicio_poliza: Optional[int] = None
    dias_desde_fin_poliza: Optional[int] = None
    dias_entre_ocurrencia_reporte: Optional[int] = None
    historial_siniestros_asegurado: Optional[int] = None
    historial_siniestros_vehiculo: Optional[int] = None
    historial_siniestros_conductor: Optional[int] = None
    score_reglas: Optional[Decimal] = None
    score_modelo_simulado: Optional[Decimal] = None
    score_final: Optional[Decimal] = None
    nivel_riesgo: Optional[str] = None
    alertas_activadas: Optional[Any] = None
    reglas_criticas_activadas: Optional[Any] = None
    accion_sugerida: Optional[str] = None
    etiqueta_fraude_simulada: Optional[int] = None

    class Config:
        from_attributes = True


class SiniestroList(SiniestroBase):
    nombre_proveedor: Optional[str] = None


class SiniestroDetail(SiniestroBase):
    nombre_proveedor: Optional[str] = None
    tipo_proveedor: Optional[str] = None
    en_lista_restrictiva: Optional[bool] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    canal_venta: Optional[str] = None
    estado_poliza: Optional[str] = None
    documentos: Optional[List[Any]] = None
    created_at: Optional[datetime] = None


class KPIs(BaseModel):
    total_siniestros: int
    casos_verdes: int
    casos_amarillos: int
    casos_rojos: int
    monto_total_reclamado: Optional[Decimal] = None
    monto_rojo_reclamado: Optional[Decimal] = None
    score_promedio: Optional[Decimal] = None


class SiniestroPage(BaseModel):
    items: List[SiniestroList]
    total: int
    limit: int
    offset: int
