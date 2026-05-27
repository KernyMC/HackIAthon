import type {
  KPIs,
  Siniestro,
  SiniestroDetail,
  SiniestroPage,
  SiniestrosParams,
  Proveedor,
  Documento,
  ChatResponse,
  NarrativasSimilaresResponse,
} from './types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function getKpis(): Promise<KPIs> {
  return apiFetch<KPIs>('/api/kpis')
}

export async function getSiniestros(params: SiniestrosParams = {}): Promise<SiniestroPage> {
  const query = new URLSearchParams()
  if (params.nivel_riesgo && params.nivel_riesgo !== 'all') {
    query.set('nivel_riesgo', params.nivel_riesgo)
  }
  if (params.ramo) query.set('ramo', params.ramo)
  if (params.search) query.set('search', params.search)
  if (params.score_min != null) query.set('score_min', String(params.score_min))
  if (params.limit != null) query.set('limit', String(params.limit))
  if (params.offset != null) query.set('offset', String(params.offset))

  const qs = query.toString()
  return apiFetch<SiniestroPage>(`/api/siniestros${qs ? `?${qs}` : ''}`)
}

export async function getSiniestro(id: string): Promise<SiniestroDetail> {
  return apiFetch<SiniestroDetail>(`/api/siniestros/${encodeURIComponent(id)}`)
}

export async function getProveedoresRiesgo(limit = 10): Promise<Proveedor[]> {
  return apiFetch<Proveedor[]>(`/api/proveedores/riesgo?limit=${limit}`)
}

export async function getDocumentosCriticos(): Promise<Documento[]> {
  return apiFetch<Documento[]>('/api/documentos/criticos')
}

export async function chat(sessionId: string, message: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message }),
  })
}

export async function getNarrativasSimilares(threshold = 0.22): Promise<NarrativasSimilaresResponse> {
  return apiFetch<NarrativasSimilaresResponse>(`/api/narrativas/similares?threshold=${threshold}`)
}

export async function healthCheck(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health')
}
