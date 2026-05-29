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
  estado_revision?: string
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
  estado_revision?: string
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
  estado_revision?: string
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

export interface EvaluarResult {
  id_siniestro: string
  score_reglas: number
  score_final: number
  nivel_riesgo: 'Verde Bajo' | 'Amarillo Medio' | 'Rojo Alto'
  alertas: string[]
  accion_sugerida: string
  proveedor_restringido: boolean
  documento_indexado: string | null
  mensaje_documento: string | null
}

export interface Revisor {
  id_revisor: string
  nombre: string
  especialidad: string
  email: string
  casos_activos: number
}

export interface RevisionResult {
  id_siniestro: string
  estado_revision: string
  revisor: Revisor
  fecha_asignacion: string
  mensaje: string
}

export interface ColaRevisionItem {
  id_siniestro: string
  ramo: string
  ciudad: string | null
  score_final: number | null
  nivel_riesgo: string | null
  estado_revision: string
  revisor_nombre: string
  revisor_especialidad: string
  fecha_asignacion: string | null
  monto_reclamado: number | null
}

export interface KanbanCard {
  id_siniestro: string
  ramo: string
  ciudad: string | null
  score_final: number | null
  nivel_riesgo: string | null
  monto_reclamado: number | null
  fecha_asignacion: string | null
  dias_en_cola: number
}

export interface KanbanColumn {
  revisor: Revisor
  casos: KanbanCard[]
}

export interface RevisionAccionPayload {
  accion: 'aprobar' | 'rechazar' | 'reasignar'
  id_revisor_nuevo?: string
}

export interface AlertaFrecuencia {
  codigo: string
  descripcion: string
  frecuencia: number
}

export interface AlertasAnalytics {
  total_alertas: number
  reglas_activadas: number
  casos_con_alertas: number
  items: AlertaFrecuencia[]
}

export interface ResumenEjecutivo {
  total_siniestros: number
  casos_rojos: number
  casos_amarillos: number
  casos_verdes: number
  monto_total_reclamado: number
  monto_en_riesgo: number
  score_promedio: number
  top_reglas: AlertaFrecuencia[]
  top_ramos: { ramo: string; total: number; rojos: number; amarillos: number }[]
  siniestros_ultimos_30_dias: number
  casos_rojos_ultimos_30_dias: number
}
