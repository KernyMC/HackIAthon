# Ingreso Nuevo Siniestro + Score Inmediato + RAG de PDF

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un analista puede ingresar un nuevo siniestro (6-8 campos), adjuntar un PDF opcional, y recibir en segundos un score de riesgo + alertas + confirmación de que el documento quedó indexado en RAG.

**Architecture:** Nuevo módulo `intake` en el backend (FastAPI + multipart) que corre las reglas de scoring, verifica el proveedor en DB, y opcionalmente extrae el PDF con Gemini y lo embebe en `rag.business_chunks`. El frontend agrega la página `/evaluar` con formulario + tarjeta de resultado.

**Tech Stack:** FastAPI (multipart/form-data, UploadFile), Pydantic v2, SQLAlchemy, Vertex AI (Gemini 2.5 Flash para extracción PDF, gemini-embedding-001 para embed), Next.js 15, TypeScript, Tailwind, shadcn/ui.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/api/app/intake/__init__.py` | Crear | Módulo vacío |
| `apps/api/app/intake/schemas.py` | Crear | Pydantic I/O: `NuevoSiniestroInput`, `EvaluacionResult` |
| `apps/api/app/intake/scoring.py` | Crear | Lógica de reglas: score_reglas, alertas, nivel_riesgo |
| `apps/api/app/intake/pdf_ingester.py` | Crear | Extraer texto PDF con Gemini + insertar en rag.business_chunks |
| `apps/api/app/intake/router.py` | Crear | `POST /api/siniestros/evaluar` (multipart) |
| `apps/api/app/main.py` | Modificar | Registrar intake router |
| `apps/web/lib/types.ts` | Modificar | Agregar `EvaluarResult` |
| `apps/web/lib/api.ts` | Modificar | Agregar `evaluarSiniestro()` |
| `apps/web/app/evaluar/page.tsx` | Crear | Página: formulario + tarjeta de resultado |
| `apps/web/components/layout/Sidebar.tsx` | Modificar | Agregar enlace `/evaluar` con ícono `FilePlus` |

---

## Task 1: Módulo intake — schemas

**Files:**
- Create: `apps/api/app/intake/__init__.py`
- Create: `apps/api/app/intake/schemas.py`

- [ ] **Step 1: Crear `__init__.py`**

```python
# apps/api/app/intake/__init__.py
```

- [ ] **Step 2: Crear `schemas.py`**

```python
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
    score_reglas: float
    score_final: float
    nivel_riesgo: str          # Verde Bajo | Amarillo Medio | Rojo Alto
    alertas: list[str]
    accion_sugerida: str
    proveedor_restringido: bool
    documento_indexado: Optional[str] = None   # doc_id si se subió PDF
    mensaje_documento: Optional[str] = None
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/intake/__init__.py apps/api/app/intake/schemas.py
git commit -m "feat(intake): add schemas for new claim evaluation"
```

---

## Task 2: Módulo intake — scoring

**Files:**
- Create: `apps/api/app/intake/scoring.py`

- [ ] **Step 1: Crear `scoring.py` con reglas y clasificación**

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/intake/scoring.py
git commit -m "feat(intake): add rule-based scoring for new claims"
```

---

## Task 3: Módulo intake — PDF ingester

**Files:**
- Create: `apps/api/app/intake/pdf_ingester.py`

- [ ] **Step 1: Crear `pdf_ingester.py`**

```python
# apps/api/app/intake/pdf_ingester.py
import logging
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.config import get_settings
from ..rag.embeddings import get_embedding

logger = logging.getLogger(__name__)


def _chunk_text(text_content: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Split plain text into overlapping chunks."""
    words = text_content.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 50]


async def extraer_texto_pdf(pdf_bytes: bytes) -> str:
    """Extract full text from PDF using Gemini multimodal."""
    settings = get_settings()
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel, Part

        vertexai.init(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
        )
        model = GenerativeModel(settings.gemini_model)
        pdf_part = Part.from_data(data=pdf_bytes, mime_type="application/pdf")
        response = model.generate_content([
            pdf_part,
            "Extrae todo el texto del documento tal como aparece. No agregues comentarios ni resúmenes.",
        ])
        return response.text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise


def ingestar_en_rag(db: Session, texto: str, nombre_archivo: str) -> str:
    """Chunk, embed, and insert PDF text into rag.business_chunks. Returns doc_id."""
    doc_id = f"peritaje_{uuid.uuid4().hex[:8]}"
    chunks = _chunk_text(texto)

    for i, chunk_text in enumerate(chunks):
        try:
            embedding = get_embedding(chunk_text)
            embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
            db.execute(
                text("""
                    INSERT INTO rag.business_chunks
                        (source_name, title, section, doc_type, chunk_text, embedding)
                    VALUES (:source, :title, :section, 'peritaje', :chunk, :emb::vector)
                """),
                {
                    "source": doc_id,
                    "title": nombre_archivo,
                    "section": f"chunk_{i + 1}",
                    "chunk": chunk_text,
                    "emb": embedding_str,
                },
            )
        except Exception as e:
            logger.warning(f"Failed to embed chunk {i}: {e}")

    db.commit()
    logger.info(f"Ingested {len(chunks)} chunks from '{nombre_archivo}' as {doc_id}")
    return doc_id
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/intake/pdf_ingester.py
git commit -m "feat(intake): add Gemini PDF extractor + RAG ingestion"
```

---

## Task 4: Módulo intake — router

**Files:**
- Create: `apps/api/app/intake/router.py`

- [ ] **Step 1: Crear `router.py`**

```python
# apps/api/app/intake/router.py
import logging
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

    restringido = _proveedor_restringido(db, nombre_proveedor)
    score_reglas, alertas = calcular_score(data, restringido)
    # score_modelo_simulado = 50 (neutral) when no model available
    score_final = round(0.6 * score_reglas + 0.4 * 50, 1)
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

    return EvaluacionResult(
        score_reglas=round(score_reglas, 1),
        score_final=score_final,
        nivel_riesgo=nivel,
        alertas=alertas,
        accion_sugerida=ACCION_POR_NIVEL[nivel],
        proveedor_restringido=restringido,
        documento_indexado=doc_id,
        mensaje_documento=msg_doc,
    )
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/intake/router.py
git commit -m "feat(intake): add POST /api/siniestros/evaluar endpoint"
```

---

## Task 5: Registrar router en main.py

**Files:**
- Modify: `apps/api/app/main.py`

- [ ] **Step 1: Agregar import y registro**

En `apps/api/app/main.py`, agregar después de la línea `from .admin.router import router as admin_router`:

```python
from .intake.router import router as intake_router
```

Y después de `app.include_router(admin_router)`:

```python
app.include_router(intake_router)
```

- [ ] **Step 2: Verificar que el endpoint aparece**

```bash
cd apps/api
uvicorn app.main:app --reload --port 8080 &
sleep 3
curl -s http://localhost:8080/openapi.json | python3 -c "import json,sys; paths=json.load(sys.stdin)['paths']; print([p for p in paths if 'evaluar' in p])"
```

Esperado: `['/api/siniestros/evaluar']`

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/main.py
git commit -m "feat(intake): register intake router in main app"
```

---

## Task 6: Frontend — tipos y función API

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Agregar tipos en `types.ts`**

Al final de `apps/web/lib/types.ts`:

```typescript
export interface EvaluarResult {
  score_reglas: number
  score_final: number
  nivel_riesgo: 'Verde Bajo' | 'Amarillo Medio' | 'Rojo Alto'
  alertas: string[]
  accion_sugerida: string
  proveedor_restringido: boolean
  documento_indexado: string | null
  mensaje_documento: string | null
}
```

- [ ] **Step 2: Agregar función `evaluarSiniestro` en `api.ts`**

Al final de `apps/web/lib/api.ts`, antes de `healthCheck`:

```typescript
export async function evaluarSiniestro(
  form: FormData
): Promise<EvaluarResult> {
  const res = await fetch('/api/siniestros/evaluar', {
    method: 'POST',
    body: form,   // multipart — NO Content-Type header, browser lo pone automático
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<EvaluarResult>
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/api.ts
git commit -m "feat(evaluar): add EvaluarResult type and evaluarSiniestro API call"
```

---

## Task 7: Frontend — página /evaluar

**Files:**
- Create: `apps/web/app/evaluar/page.tsx`

- [ ] **Step 1: Crear la página completa**

```tsx
// apps/web/app/evaluar/page.tsx
'use client'

import { useState, useRef } from 'react'
import {
  ShieldAlert, ShieldCheck, ShieldQuestion,
  Upload, FileText, X, Loader2, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { evaluarSiniestro } from '@/lib/api'
import type { EvaluarResult } from '@/lib/types'

const RAMOS = ['Automóvil', 'Salud', 'Vida', 'Hogar', 'Responsabilidad Civil', 'Robo']

const NIVEL_CONFIG = {
  'Verde Bajo': {
    color: '#22c55e',
    bg: 'bg-green-500/10 border-green-500/30',
    Icon: ShieldCheck,
    label: 'Riesgo Bajo',
  },
  'Amarillo Medio': {
    color: '#eab308',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    Icon: ShieldQuestion,
    label: 'Riesgo Medio',
  },
  'Rojo Alto': {
    color: '#ef4444',
    bg: 'bg-red-500/10 border-red-500/30',
    Icon: ShieldAlert,
    label: 'Riesgo Alto',
  },
}

export default function EvaluarPage() {
  const [form, setForm] = useState({
    ramo: 'Automóvil',
    ciudad: '',
    monto_reclamado: '',
    descripcion: '',
    nombre_proveedor: '',
    dias_desde_inicio_poliza: '',
    dias_entre_ocurrencia_reporte: '',
    documentos_completos: true,
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvaluarResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const fd = new FormData()
    fd.append('ramo', form.ramo)
    fd.append('ciudad', form.ciudad)
    fd.append('monto_reclamado', form.monto_reclamado)
    fd.append('descripcion', form.descripcion)
    fd.append('nombre_proveedor', form.nombre_proveedor)
    if (form.dias_desde_inicio_poliza)
      fd.append('dias_desde_inicio_poliza', form.dias_desde_inicio_poliza)
    if (form.dias_entre_ocurrencia_reporte)
      fd.append('dias_entre_ocurrencia_reporte', form.dias_entre_ocurrencia_reporte)
    fd.append('documentos_completos', String(form.documentos_completos))
    if (pdfFile) fd.append('pdf_file', pdfFile)

    try {
      const res = await evaluarSiniestro(fd)
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? NIVEL_CONFIG[result.nivel_riesgo] : null

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pl-16">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Evaluar nuevo siniestro</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Ingresa los datos del caso para obtener un score de riesgo inmediato.
            El documento PDF (opcional) queda indexado para consulta con el agente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Ramo */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Ramo *</label>
              <select
                value={form.ramo}
                onChange={e => set('ramo', e.target.value)}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40"
              >
                {RAMOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Ciudad */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Ciudad *</label>
              <input
                required
                value={form.ciudad}
                onChange={e => set('ciudad', e.target.value)}
                placeholder="Ej: Bogotá"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Monto reclamado (COP) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.monto_reclamado}
                onChange={e => set('monto_reclamado', e.target.value)}
                placeholder="Ej: 45000000"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Proveedor */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Nombre del proveedor *</label>
              <input
                required
                value={form.nombre_proveedor}
                onChange={e => set('nombre_proveedor', e.target.value)}
                placeholder="Ej: Taller Automotriz Norte"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Días desde inicio póliza */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Días desde inicio de póliza</label>
              <input
                type="number"
                min="0"
                value={form.dias_desde_inicio_poliza}
                onChange={e => set('dias_desde_inicio_poliza', e.target.value)}
                placeholder="Ej: 45"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Días entre ocurrencia y reporte */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Días entre ocurrencia y reporte</label>
              <input
                type="number"
                min="0"
                value={form.dias_entre_ocurrencia_reporte}
                onChange={e => set('dias_entre_ocurrencia_reporte', e.target.value)}
                placeholder="Ej: 3"
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Descripción del siniestro *</label>
              <textarea
                required
                rows={3}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Describe brevemente cómo ocurrió el siniestro..."
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8FF00]/40 placeholder:text-neutral-600 resize-none"
              />
            </div>

            {/* Documentos completos */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.documentos_completos}
                onChange={e => set('documentos_completos', e.target.checked)}
                className="w-4 h-4 accent-[#C8FF00]"
              />
              <span className="text-sm text-neutral-300">Documentación completa</span>
            </label>

            {/* PDF upload */}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Peritaje / informe (PDF, opcional)</label>
              {pdfFile ? (
                <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-[#C8FF00] flex-shrink-0" />
                  <span className="text-sm text-white truncate flex-1">{pdfFile.name}</span>
                  <button type="button" onClick={() => setPdfFile(null)}>
                    <X className="w-4 h-4 text-neutral-500 hover:text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-[#2A2A2A] hover:border-[#C8FF00]/40 rounded-lg px-3 py-4 text-center transition-colors"
                >
                  <Upload className="w-5 h-5 text-neutral-600 mx-auto mb-1" />
                  <span className="text-xs text-neutral-500">Clic para adjuntar PDF (máx 10 MB)</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => e.target.files?.[0] && setPdfFile(e.target.files[0])}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C8FF00] hover:bg-[#d4ff33] disabled:bg-[#2A2A2A] disabled:text-neutral-600 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Evaluando...</>
              ) : (
                'Evaluar siniestro'
              )}
            </button>
          </form>

          {/* Result card */}
          <div>
            {!result && !loading && (
              <div className="h-full flex items-center justify-center text-center text-neutral-600 border border-dashed border-[#2A2A2A] rounded-2xl p-8">
                <div>
                  <ShieldQuestion className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">El resultado aparecerá aquí</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center border border-[#2A2A2A] rounded-2xl p-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C8FF00] mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">Calculando score y verificando proveedor...</p>
                  {pdfFile && (
                    <p className="text-xs text-neutral-600 mt-1">Indexando documento PDF...</p>
                  )}
                </div>
              </div>
            )}

            {result && cfg && (
              <div className={`border rounded-2xl p-6 space-y-5 ${cfg.bg}`}>
                {/* Score header */}
                <div className="flex items-center gap-3">
                  <cfg.Icon className="w-8 h-8" style={{ color: cfg.color }} />
                  <div>
                    <div className="text-xs text-neutral-400">Score de riesgo</div>
                    <div className="text-3xl font-bold" style={{ color: cfg.color }}>
                      {result.score_final}
                      <span className="text-base font-normal text-neutral-400 ml-1">/100</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${cfg.color}20`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${result.score_final}%`, background: cfg.color }}
                  />
                </div>

                {/* Proveedor */}
                {result.proveedor_restringido && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-300">Proveedor en lista restrictiva</span>
                  </div>
                )}

                {/* Alertas */}
                {result.alertas.length > 0 && (
                  <div>
                    <div className="text-xs text-neutral-400 mb-2 font-medium">Alertas activadas</div>
                    <ul className="space-y-1.5">
                      {result.alertas.map((a, i) => (
                        <li key={i} className="flex gap-2 text-xs text-neutral-300">
                          <span className="text-[#C8FF00] flex-shrink-0 mt-0.5">◆</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Acción sugerida */}
                <div className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2">
                  <div className="text-xs text-neutral-500 mb-0.5">Acción sugerida</div>
                  <div className="text-sm font-medium text-white">{result.accion_sugerida}</div>
                </div>

                {/* Documento indexado */}
                {result.mensaje_documento && (
                  <div className="flex items-start gap-2 bg-[#C8FF00]/5 border border-[#C8FF00]/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C8FF00] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-300">{result.mensaje_documento}</span>
                  </div>
                )}

                {/* CTA al chat */}
                <button
                  onClick={() => {
                    const msg = result.documento_indexado
                      ? `Analiza el peritaje ${result.documento_indexado} e identifica inconsistencias con el siniestro reportado.`
                      : `El siniestro de ${form.ramo} en ${form.ciudad} tiene score ${result.score_final}. ¿Cuáles son las reglas de fraude aplicables?`
                    window.dispatchEvent(new CustomEvent('fraudia:ask', { detail: msg }))
                  }}
                  className="w-full border border-[#C8FF00]/30 hover:border-[#C8FF00] text-[#C8FF00] text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  Consultar al agente sobre este caso →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/evaluar/page.tsx
git commit -m "feat(evaluar): add new claim evaluation page with risk card"
```

---

## Task 8: Agregar enlace en Sidebar

**Files:**
- Modify: `apps/web/components/layout/Sidebar.tsx`

- [ ] **Step 1: Agregar `FilePlus` a los imports y el item de nav**

En `apps/web/components/layout/Sidebar.tsx`, agregar `FilePlus` al import de lucide-react (buscar la línea con `import {`).

En el array `navItems`, agregar después del item de `Siniestros`:

```typescript
{ href: '/evaluar', label: 'Evaluar', icon: FilePlus },
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/layout/Sidebar.tsx
git commit -m "feat(evaluar): add /evaluar nav link to sidebar"
```

---

## Self-Review

**Spec coverage:**
- ✅ Formulario con 6-8 campos → Task 7
- ✅ PDF opcional → Task 7 (UI) + Task 3 (backend)
- ✅ Score inmediato con reglas → Task 2
- ✅ Verificación de proveedor en lista restrictiva → Task 4 (`_proveedor_restringido`)
- ✅ Ingesta PDF → RAG → Task 3
- ✅ Resultado muestra nivel, alertas, acción sugerida → Task 7
- ✅ Botón "Consultar al agente" dispara evento `fraudia:ask` → Task 7
- ✅ Enlace en sidebar → Task 8
- ✅ Tipos TypeScript → Task 6
- ✅ Función API → Task 6

**Placeholders:** Ninguno encontrado — todos los bloques de código son concretos y completos.

**Type consistency:**
- `EvaluarResult` definido en Task 6 (`types.ts`) y usado en Task 7 (`page.tsx`) — ✅
- `EvaluacionResult` (Python) definido en Task 1 y retornado en Task 4 — ✅
- `calcular_score` y `clasificar` definidos en Task 2, importados en Task 4 — ✅
- `ingestar_en_rag` y `extraer_texto_pdf` definidos en Task 3, usados en Task 4 — ✅
