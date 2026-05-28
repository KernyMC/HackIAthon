# apps/api/app/intake/scoring.py
from .schemas import NuevoSiniestroInput

UMBRAL_MONTO_RAMO = {
    "Automóvil": 50_000,
    "Salud": 80_000,
    "Vida": 200_000,
    "Hogar": 40_000,
    "Responsabilidad Civil": 100_000,
    "Robo": 30_000,
}

ACCION_POR_NIVEL = {
    "Verde Bajo": "Continuar flujo normal de aprobación",
    "Amarillo Medio": "Solicitar revisión supervisora antes de pagar",
    "Rojo Alto": "Escalar a equipo de antifraude — no pagar sin aprobación",
}


def calcular_score(
    data: NuevoSiniestroInput, proveedor_restringido: bool
) -> tuple[float, list[str]]:
    score = 0.0
    alertas: list[str] = []

    # RF-01: Siniestro cercano al inicio de póliza
    if data.dias_desde_inicio_poliza is not None and data.dias_desde_inicio_poliza <= 90:
        score += 30
        alertas.append(
            f"Siniestro ocurrido {data.dias_desde_inicio_poliza} días después del inicio de póliza (umbral: 90)"
        )

    # RF-02: Proveedor en lista restrictiva
    if proveedor_restringido:
        score += 35
        alertas.append(f"Proveedor '{data.nombre_proveedor}' figura en lista restrictiva")

    # RF-03: Monto elevado para el ramo
    umbral = UMBRAL_MONTO_RAMO.get(data.ramo, 60_000)
    if data.monto_reclamado > umbral * 1.5:
        score += 20
        alertas.append(
            f"Monto ${data.monto_reclamado:,.0f} supera 1.5× el umbral de {data.ramo} (${umbral:,.0f})"
        )

    # RF-04: Documentación incompleta
    if not data.documentos_completos:
        score += 10
        alertas.append("Documentación declarada como incompleta")

    # RF-05: Reporte tardío
    if data.dias_entre_ocurrencia_reporte is not None and data.dias_entre_ocurrencia_reporte > 15:
        score += 5
        alertas.append(
            f"Reporte tardío: {data.dias_entre_ocurrencia_reporte} días después de la ocurrencia"
        )

    return min(score, 100.0), alertas


def clasificar(score: float) -> str:
    if score >= 70:
        return "Rojo Alto"
    if score >= 40:
        return "Amarillo Medio"
    return "Verde Bajo"
