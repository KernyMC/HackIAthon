export interface KPIs {
  total_siniestros: number
  casos_verdes: number
  casos_amarillos: number
  casos_rojos: number
  monto_total_reclamado: number
  monto_rojo_reclamado: number
  score_promedio: number
}

export interface Siniestro {
  id_siniestro: string
  id_poliza: string
  id_asegurado: string
  id_vehiculo: string
  id_conductor: string
  id_proveedor: string
  ramo: string
  cobertura: string
  ciudad: string
  sucursal: string
  estado: string
  fecha_ocurrencia: string
  fecha_reporte: string
  monto_reclamado: number
  monto_estimado: number
  monto_pagado: number
  suma_asegurada: number
  descripcion: string
  documentos_completos: boolean
  dias_desde_inicio_poliza: number
  dias_desde_fin_poliza: number
  dias_entre_ocurrencia_reporte: number
  historial_siniestros_asegurado: number
  historial_siniestros_vehiculo: number
  historial_siniestros_conductor: number
  score_reglas: number
  score_modelo_simulado: number
  score_final: number
  nivel_riesgo: string
  alertas_activadas: string[]
  reglas_criticas_activadas: string[]
  accion_sugerida: string
  etiqueta_fraude_simulada: number
  created_at: string
  // from joins
  nombre_proveedor?: string
  tipo_proveedor?: string
  en_lista_restrictiva?: boolean
  fecha_inicio?: string
  fecha_fin?: string
  canal_venta?: string
  estado_poliza?: string
}

export interface Documento {
  id_documento: string
  id_siniestro: string
  tipo_documento: string
  entregado: boolean
  legible: boolean
  fecha_emision: string | null
  inconsistencia_detectada: boolean
  observacion: string | null
}

export interface SiniestroDetail extends Siniestro {
  documentos: Documento[]
}

export interface SiniestroPage {
  items: Siniestro[]
  total: number
  limit: number
  offset: number
}

export interface SiniestrosParams {
  nivel_riesgo?: string
  ramo?: string
  search?: string
  score_min?: number
  limit?: number
  offset?: number
}

export interface Proveedor {
  id_proveedor: string
  nombre_proveedor: string
  tipo: string
  ciudad_proveedor: string
  total_siniestros: number
  casos_rojos: number
  casos_amarillos: number
  score_promedio: number
  monto_total_reclamado: number
  // from providers table
  en_lista_restrictiva?: boolean
  reclamos_asociados?: number
  monto_promedio_reclamado?: number
  porcentaje_casos_observados?: number
  antiguedad_meses?: number
}

export interface ChartData {
  type: 'bar' | 'pie'
  title: string
  data: { name: string; value: number; color?: string }[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tools_used?: string[]
  citations?: Citation[]
  timestamp?: string
  chart?: ChartData
}

export interface Citation {
  type: string
  source: string
}

export interface ChatResponse {
  answer: string
  tools_used: string[]
  citations: Citation[]
}

export type NivelRiesgo = 'Verde Bajo' | 'Amarillo Medio' | 'Rojo Alto' | 'all'

export interface NarrativaPar {
  id_par: number
  id_siniestro_a: string
  id_siniestro_b: string
  cluster_narrativa: number
  similitud: number
  descripcion_a: string
  descripcion_b: string
  nombre_proveedor?: string
}

export interface NarrativaCluster {
  cluster_narrativa: number
  total_pares: number
  similitud_promedio: number
  casos_aprox: number
}

export interface NarrativasResumen {
  total_clusters: number
  total_pares: number
  casos_involucrados: number
  similitud_promedio: number
}

export interface NarrativasSimilaresResponse {
  resumen: NarrativasResumen
  clusters: NarrativaCluster[]
  pares: NarrativaPar[]
}
