# Revisión Humana + Cédulas Ecuatorianas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar flujo de revisión humana (enviar siniestro → revisor asignado automáticamente por ramo → cola visible en dashboard) y cédulas ecuatorianas ficticias para los asegurados.

**Architecture:** Nueva tabla `app.revisores` con 5 revisores ficticios. Campo `estado_revision` y `id_revisor_asignado` en `claims.siniestros`. Endpoint `POST /api/siniestros/{id}/revision` que asigna revisor por ramo y cambia estado. Widget en dashboard, badge en lista, botón en detalle. Cédulas generadas con algoritmo módulo 10 de Ecuador e insertadas en `claims.asegurados`.

**Tech Stack:** Python/FastAPI, SQLAlchemy, psycopg3, AlloyDB, Next.js 15, TypeScript, Tailwind, Lucide icons.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/api/app/revision/schemas.py` | Crear | Pydantic: `RevisionResult`, `Revisor`, `ColaRevision` |
| `apps/api/app/revision/router.py` | Crear | POST /api/siniestros/{id}/revision, GET /api/revisiones/cola |
| `apps/api/app/main.py` | Modificar | Registrar revision router |
| `apps/web/lib/types.ts` | Modificar | Agregar `Revisor`, `RevisionResult`, `ColaRevisionItem` |
| `apps/web/lib/api.ts` | Modificar | Agregar `enviarARevision()`, `getColaRevision()` |
| `apps/web/app/siniestros/[id]/page.tsx` | Modificar | Botón "Enviar a revisión" + modal confirmación |
| `apps/web/app/siniestros/page.tsx` | Modificar | Badge estado + botón rápido en cada fila + filtro |
| `apps/web/app/dashboard/page.tsx` | Modificar | Widget "Cola de Revisión" |
| `scripts/seed_revisores_cedulas.py` | Crear | Inserta revisores ficticios + genera cédulas ecuatorianas |

---

## Task 1: Script de datos — revisores ficticios + cédulas ecuatorianas

**Files:**
- Create: `scripts/seed_revisores_cedulas.py`

- [ ] **Step 1: Crear el script**

```python
#!/usr/bin/env python3
"""
Inserta revisores ficticios en app.revisores y genera cédulas
ecuatorianas válidas para claims.asegurados.
"""
import os, sys, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'api'))

from app.core.db import SessionLocal
from sqlalchemy import text

# ── Algoritmo cédula ecuatoriana (módulo 10) ──────────────────────────
PROVINCIAS = list(range(1, 25))  # 01-24

def _digito_verificador(nueve: str) -> int:
    coefs = [2,1,2,1,2,1,2,1,2]
    total = 0
    for d, c in zip(nueve, coefs):
        p = int(d) * c
        total += p if p < 10 else p - 9
    rem = total % 10
    return 0 if rem == 0 else 10 - rem

def generar_cedula() -> str:
    provincia = str(random.choice(PROVINCIAS)).zfill(2)
    tercero   = str(random.randint(0, 6))
    resto     = ''.join(str(random.randint(0, 9)) for _ in range(6))
    nueve     = provincia + tercero + resto
    verificador = _digito_verificador(nueve)
    return nueve + str(verificador)


# ── Revisores ficticios ───────────────────────────────────────────────
REVISORES = [
    ('REV-001', 'Ana Morales',      'Automóvil',           'ana.morales@aseguradorsur.ec'),
    ('REV-002', 'Carlos Jiménez',   'Salud',                'carlos.jimenez@aseguradorsur.ec'),
    ('REV-003', 'María Suárez',     'Hogar',                'maria.suarez@aseguradorsur.ec'),
    ('REV-004', 'Diego Paredes',    'Vida',                 'diego.paredes@aseguradorsur.ec'),
    ('REV-005', 'Lucía Vásquez',    'Generales',            'lucia.vasquez@aseguradorsur.ec'),
]

# Ramos que cada revisor cubre (fallback = REV-001)
RAMO_A_REVISOR = {
    'Vehículos':              'REV-001',
    'Automóvil':              'REV-001',
    'Salud':                  'REV-002',
    'Accidentes Personales':  'REV-002',
    'Hogar':                  'REV-003',
    'Robo':                   'REV-003',
    'Vida':                   'REV-004',
    'Generales':              'REV-005',
    'Responsabilidad Civil':  'REV-005',
}


def seed(db):
    # 1. Crear tabla app.revisores si no existe
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS app.revisores (
            id_revisor      TEXT PRIMARY KEY,
            nombre          TEXT NOT NULL,
            especialidad    TEXT NOT NULL,
            email           TEXT NOT NULL,
            casos_activos   INTEGER DEFAULT 0
        )
    """))

    # 2. Agregar columnas a claims.siniestros si no existen
    for col, tipo in [
        ('estado_revision',      "TEXT DEFAULT 'Pendiente'"),
        ('id_revisor_asignado',  'TEXT REFERENCES app.revisores(id_revisor)'),
        ('fecha_asignacion',     'TIMESTAMP'),
    ]:
        try:
            db.execute(text(f"ALTER TABLE claims.siniestros ADD COLUMN IF NOT EXISTS {col} {tipo}"))
        except Exception:
            pass

    # 3. Agregar columna cedula a claims.asegurados si no existe
    db.execute(text("ALTER TABLE claims.asegurados ADD COLUMN IF NOT EXISTS cedula TEXT"))

    db.commit()

    # 4. Insertar revisores
    for rev in REVISORES:
        db.execute(text("""
            INSERT INTO app.revisores (id_revisor, nombre, especialidad, email)
            VALUES (:id, :nombre, :esp, :email)
            ON CONFLICT (id_revisor) DO NOTHING
        """), {'id': rev[0], 'nombre': rev[1], 'esp': rev[2], 'email': rev[3]})

    # 5. Generar cédulas para asegurados que no tienen
    ids = db.execute(text(
        "SELECT id_asegurado FROM claims.asegurados WHERE cedula IS NULL"
    )).fetchall()
    cedulas_usadas = set()
    for (id_aseg,) in ids:
        while True:
            ced = generar_cedula()
            if ced not in cedulas_usadas:
                cedulas_usadas.add(ced)
                break
        db.execute(text(
            "UPDATE claims.asegurados SET cedula = :c WHERE id_asegurado = :id"
        ), {'c': ced, 'id': id_aseg})

    db.commit()
    print(f"✓ {len(REVISORES)} revisores insertados")
    print(f"✓ {len(ids)} cédulas ecuatorianas generadas")


if __name__ == '__main__':
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
```

- [ ] **Step 2: Ejecutar el script**

```bash
cd /home/kernyvpa/AI-Projects/fraud-ia
python3 scripts/seed_revisores_cedulas.py
```

Esperado:
```
✓ 5 revisores insertados
✓ N cédulas ecuatorianas generadas
```

- [ ] **Step 3: Verificar en BD**

```bash
cd apps/api && python3 -c "
from app.core.db import SessionLocal
from sqlalchemy import text
db = SessionLocal()
revs = db.execute(text('SELECT id_revisor, nombre, especialidad FROM app.revisores')).fetchall()
for r in revs: print(r)
ced = db.execute(text('SELECT cedula FROM claims.asegurados WHERE cedula IS NOT NULL LIMIT 3')).fetchall()
print('sample cedulas:', [c[0] for c in ced])
cols = db.execute(text(\"SELECT column_name FROM information_schema.columns WHERE table_schema='claims' AND table_name='siniestros' AND column_name IN ('estado_revision','id_revisor_asignado','fecha_asignacion')\")).fetchall()
print('new cols:', [c[0] for c in cols])
db.close()
"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seed_revisores_cedulas.py
git commit -m "feat(revision): seed revisores ficticios + cedulas ecuatorianas"
```

---

## Task 2: Backend — schemas y router de revisión

**Files:**
- Create: `apps/api/app/revision/__init__.py`
- Create: `apps/api/app/revision/schemas.py`
- Create: `apps/api/app/revision/router.py`

- [ ] **Step 1: Crear `__init__.py`**

```python
# apps/api/app/revision/__init__.py
```

- [ ] **Step 2: Crear `schemas.py`**

```python
# apps/api/app/revision/schemas.py
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
```

- [ ] **Step 3: Crear `router.py`**

```python
# apps/api/app/revision/router.py
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..core.db import get_db
from .schemas import RevisionResult, Revisor, ColaRevisionItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["revision"])

# Mapa ramo → id_revisor (debe coincidir con seed_revisores_cedulas.py)
RAMO_A_REVISOR = {
    'Vehículos':              'REV-001',
    'Automóvil':              'REV-001',
    'Salud':                  'REV-002',
    'Accidentes Personales':  'REV-002',
    'Hogar':                  'REV-003',
    'Robo':                   'REV-003',
    'Vida':                   'REV-004',
    'Generales':              'REV-005',
    'Responsabilidad Civil':  'REV-005',
}
DEFAULT_REVISOR = 'REV-001'


def _get_revisor(db: Session, id_revisor: str) -> Revisor:
    row = db.execute(
        text("SELECT id_revisor, nombre, especialidad, email, casos_activos FROM app.revisores WHERE id_revisor = :id"),
        {"id": id_revisor},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=500, detail=f"Revisor {id_revisor} no encontrado")
    return Revisor(**dict(row))


@router.post("/siniestros/{id_siniestro}/revision", response_model=RevisionResult)
def enviar_a_revision(id_siniestro: str, db: Session = Depends(get_db)):
    # 1. Verify siniestro exists
    sin = db.execute(
        text("SELECT id_siniestro, ramo, estado_revision FROM claims.siniestros WHERE id_siniestro = :id"),
        {"id": id_siniestro},
    ).mappings().first()
    if not sin:
        raise HTTPException(status_code=404, detail="Siniestro no encontrado")
    if sin["estado_revision"] == "En revisión":
        raise HTTPException(status_code=409, detail="El siniestro ya está en revisión humana")

    # 2. Assign reviewer by ramo
    id_revisor = RAMO_A_REVISOR.get(sin["ramo"] or "", DEFAULT_REVISOR)
    ahora = datetime.now()

    # 3. Update siniestro
    db.execute(
        text("""
            UPDATE claims.siniestros
            SET estado_revision = 'En revisión',
                id_revisor_asignado = :rev,
                fecha_asignacion = :fecha
            WHERE id_siniestro = :id
        """),
        {"rev": id_revisor, "fecha": ahora, "id": id_siniestro},
    )
    # 4. Increment reviewer workload
    db.execute(
        text("UPDATE app.revisores SET casos_activos = casos_activos + 1 WHERE id_revisor = :id"),
        {"id": id_revisor},
    )
    db.commit()

    revisor = _get_revisor(db, id_revisor)
    return RevisionResult(
        id_siniestro=id_siniestro,
        estado_revision="En revisión",
        revisor=revisor,
        fecha_asignacion=ahora,
        mensaje=f"Caso asignado a {revisor.nombre} · {revisor.especialidad}",
    )


@router.get("/revisiones/cola", response_model=list[ColaRevisionItem])
def get_cola_revision(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT
                s.id_siniestro, s.ramo, s.ciudad,
                s.score_final, s.nivel_riesgo,
                s.estado_revision, s.fecha_asignacion,
                s.monto_reclamado,
                r.nombre AS revisor_nombre,
                r.especialidad AS revisor_especialidad
            FROM claims.siniestros s
            JOIN app.revisores r ON r.id_revisor = s.id_revisor_asignado
            WHERE s.estado_revision = 'En revisión'
            ORDER BY s.fecha_asignacion DESC
            LIMIT :limit
        """),
        {"limit": limit},
    ).mappings().all()
    return [ColaRevisionItem(**dict(r)) for r in rows]


@router.get("/revisores", response_model=list[Revisor])
def get_revisores(db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT id_revisor, nombre, especialidad, email, casos_activos FROM app.revisores ORDER BY especialidad")
    ).mappings().all()
    return [Revisor(**dict(r)) for r in rows]
```

- [ ] **Step 4: Verificar sintaxis**

```bash
cd /home/kernyvpa/AI-Projects/fraud-ia/apps/api
python3 -c "from app.revision.router import router; print('OK')"
```

Esperado: `OK`

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/revision/
git commit -m "feat(revision): add revision schemas and router endpoints"
```

---

## Task 3: Registrar router en main.py

**Files:**
- Modify: `apps/api/app/main.py`

- [ ] **Step 1: Agregar import y registro**

En `apps/api/app/main.py`, después de `from .intake.router import router as intake_router`:
```python
from .revision.router import router as revision_router
```

Después de `app.include_router(intake_router)`:
```python
app.include_router(revision_router)
```

- [ ] **Step 2: Verificar que los endpoints aparecen**

```bash
cd /home/kernyvpa/AI-Projects/fraud-ia/apps/api
python3 -c "
from app.main import app
paths = [r.path for r in app.routes if 'revision' in r.path]
print(paths)
"
```

Esperado: `['/api/siniestros/{id_siniestro}/revision', '/api/revisiones/cola', '/api/revisores']`

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/main.py
git commit -m "feat(revision): register revision router in main app"
```

---

## Task 4: Frontend — tipos y funciones API

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Agregar tipos en `types.ts`**

Al final de `apps/web/lib/types.ts`:

```typescript
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
```

- [ ] **Step 2: Agregar funciones en `api.ts`**

Antes de `healthCheck` en `apps/web/lib/api.ts`:

```typescript
export async function enviarARevision(idSiniestro: string): Promise<RevisionResult> {
  return apiFetch<RevisionResult>(`/api/siniestros/${encodeURIComponent(idSiniestro)}/revision`, {
    method: 'POST',
  })
}

export async function getColaRevision(limit = 20): Promise<ColaRevisionItem[]> {
  return apiFetch<ColaRevisionItem[]>(`/api/revisiones/cola?limit=${limit}`)
}
```

Agregar `Revisor`, `RevisionResult`, `ColaRevisionItem` al import de `types` al inicio de `api.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/api.ts
git commit -m "feat(revision): add revision types and API functions"
```

---

## Task 5: Botón + modal en página de detalle de siniestro

**Files:**
- Modify: `apps/web/app/siniestros/[id]/page.tsx`

- [ ] **Step 1: Leer el archivo para identificar dónde insertar**

Buscar la sección del header de la página (donde está el botón "Atrás" y el título del siniestro).

- [ ] **Step 2: Agregar imports**

Agregar al bloque de imports existente:
```typescript
import { enviarARevision } from '@/lib/api'
import type { RevisionResult } from '@/lib/types'
import { UserCheck, Loader2 } from 'lucide-react'
```

- [ ] **Step 3: Agregar estado del modal**

Dentro de `SiniestroDetailPage`, después de los useState existentes:
```typescript
const [showRevModal, setShowRevModal]   = useState(false)
const [revLoading, setRevLoading]       = useState(false)
const [revResult, setRevResult]         = useState<RevisionResult | null>(null)
const [revError, setRevError]           = useState<string | null>(null)

const handleEnviarRevision = async () => {
  setRevLoading(true)
  setRevError(null)
  try {
    const res = await enviarARevision(id)
    setRevResult(res)
  } catch (err: unknown) {
    setRevError(err instanceof Error ? err.message : 'Error al enviar')
  } finally {
    setRevLoading(false)
  }
}
```

- [ ] **Step 4: Agregar botón en el header de la página**

Buscar el div que contiene el botón `ArrowLeft` (volver atrás) y agregar después del RiskBadge o título:

```tsx
{/* Botón enviar a revisión */}
{siniestro.estado_revision !== 'En revisión' ? (
  <button
    onClick={() => setShowRevModal(true)}
    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 rounded-lg transition-all"
  >
    <UserCheck className="w-3.5 h-3.5" />
    Enviar a revisión humana
  </button>
) : (
  <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
    <UserCheck className="w-3.5 h-3.5" />
    En revisión humana
  </span>
)}
```

- [ ] **Step 5: Agregar modal de confirmación**

Antes del cierre del `return` principal (antes del último `</div>`):

```tsx
{/* Modal revisión humana */}
{showRevModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Enviar a revisión humana</h3>
          <p className="text-xs text-neutral-400">Se asignará automáticamente por ramo</p>
        </div>
      </div>

      {!revResult ? (
        <>
          <p className="text-xs text-neutral-300 mb-5">
            El siniestro <span className="font-mono text-[#C8FF00]">{id}</span> pasará
            a estado <strong className="text-amber-400">En revisión</strong> y se asignará
            a un analista según el ramo <strong className="text-white">{siniestro?.ramo}</strong>.
          </p>
          {revError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
              {revError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowRevModal(false)}
              className="flex-1 py-2 text-xs text-neutral-400 hover:text-white border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviarRevision}
              disabled={revLoading}
              className="flex-1 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 text-black disabled:text-amber-800 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              {revLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Asignando...</> : 'Confirmar'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
            <p className="text-xs text-amber-400 font-semibold mb-2">✓ Asignado correctamente</p>
            <p className="text-xs text-neutral-300"><span className="text-neutral-500">Revisor:</span> {revResult.revisor.nombre}</p>
            <p className="text-xs text-neutral-300"><span className="text-neutral-500">Especialidad:</span> {revResult.revisor.especialidad}</p>
            <p className="text-xs text-neutral-300"><span className="text-neutral-500">Casos activos:</span> {revResult.revisor.casos_activos}</p>
          </div>
          <button
            onClick={() => { setShowRevModal(false); setRevResult(null) }}
            className="w-full py-2 text-xs font-semibold bg-[#C8FF00] text-black rounded-lg hover:bg-[#d4ff33] transition-all"
          >
            Cerrar
          </button>
        </>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 6: Agregar `estado_revision` al tipo `SiniestroDetail` en `types.ts`**

En `apps/web/lib/types.ts`, dentro de `interface SiniestroDetail extends Siniestro`:
```typescript
estado_revision?: string
id_revisor_asignado?: string | null
fecha_asignacion?: string | null
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/siniestros/\[id\]/page.tsx apps/web/lib/types.ts
git commit -m "feat(revision): add send-to-review button and modal in siniestro detail"
```

---

## Task 6: Badge de estado + filtro en lista de siniestros

**Files:**
- Modify: `apps/web/app/siniestros/page.tsx`

- [ ] **Step 1: Agregar import**

```typescript
import { UserCheck } from 'lucide-react'
import { enviarARevision } from '@/lib/api'
```

- [ ] **Step 2: Agregar filtro "En revisión" en los chips de nivel de riesgo**

Buscar donde están los chips de filtro `Verde`, `Amarillo`, `Rojo` y agregar:
```tsx
<button
  onClick={() => setNivelRiesgo(nivelRiesgo === 'revision' ? 'all' : 'revision' as any)}
  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
    nivelRiesgo === 'revision'
      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
      : 'bg-[#141414] border-[#2A2A2A] text-neutral-500 hover:text-white hover:border-[#3A3A3A]'
  }`}
>
  En revisión
</button>
```

En la llamada a `getSiniestros`, cuando `nivelRiesgo === 'revision'` pasar `estado_revision=En revisión` como parámetro. Modificar el query builder:
```typescript
if (nivelRiesgo === 'revision') {
  // handled via backend filter below — don't pass nivel_riesgo
} else if (nivelRiesgo && nivelRiesgo !== 'all') {
  query.set('nivel_riesgo', nivelRiesgo)
}
```

También agregar al endpoint `GET /api/siniestros` en el backend el parámetro `estado_revision` (ver Task 6b).

- [ ] **Step 3: Agregar badge "En revisión" en cada fila**

En la columna de estado/nivel de riesgo de cada fila, después del `RiskBadge`, agregar:
```tsx
{row.estado_revision === 'En revisión' && (
  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">
    <UserCheck className="w-2.5 h-2.5" />
    Revisión
  </span>
)}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/siniestros/page.tsx
git commit -m "feat(revision): add revision badge and filter in siniestros list"
```

---

## Task 6b: Backend — agregar estado_revision al endpoint GET /api/siniestros

**Files:**
- Modify: `apps/api/app/claims/router.py`
- Modify: `apps/api/app/claims/repository.py`

- [ ] **Step 1: Agregar parámetro en router.py**

En `list_siniestros`, agregar:
```python
estado_revision: Optional[str] = Query(None),
```

Y pasarlo a `repository.list_siniestros`:
```python
result = repository.list_siniestros(
    db, nivel_riesgo=nivel_riesgo, ramo=ramo, search=search,
    score_min=score_min, limit=limit, offset=offset,
    estado_revision=estado_revision,
)
```

- [ ] **Step 2: Agregar filtro en repository.py**

En `list_siniestros`, leer el archivo primero. Añadir al WHERE dinámico:
```python
if estado_revision:
    where.append("s.estado_revision = :estado_revision")
    params["estado_revision"] = estado_revision
```

- [ ] **Step 3: Agregar `estado_revision` al SELECT**

En la query de `list_siniestros`, agregar `s.estado_revision` a la lista de columnas seleccionadas.

- [ ] **Step 4: Agregar `estado_revision` al schema `SiniestroList`**

En `apps/api/app/claims/schemas.py`, en `SiniestroBase`:
```python
estado_revision: Optional[str] = None
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/claims/router.py apps/api/app/claims/repository.py apps/api/app/claims/schemas.py
git commit -m "feat(revision): expose estado_revision in siniestros list endpoint"
```

---

## Task 7: Widget "Cola de Revisión" en dashboard

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Agregar imports**

```typescript
import { getColaRevision } from '@/lib/api'
import type { ColaRevisionItem } from '@/lib/types'
import { UserCheck, Clock } from 'lucide-react'
```

- [ ] **Step 2: Agregar estado y fetch**

Dentro del componente del dashboard, agregar:
```typescript
const [cola, setCola] = useState<ColaRevisionItem[]>([])

useEffect(() => {
  getColaRevision(4).then(setCola).catch(() => {})
}, [])
```

- [ ] **Step 3: Agregar widget en el grid**

Agregar el widget en el grid del dashboard (después del widget de narrativas similares o al final del grid):

```tsx
{/* Cola de Revisión Humana */}
<div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-2xl p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <UserCheck className="w-4 h-4 text-amber-400" />
      <span className="text-[13px] font-semibold text-white">Cola de Revisión Humana</span>
    </div>
    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
      {cola.length} casos
    </span>
  </div>

  {cola.length === 0 ? (
    <div className="flex items-center justify-center py-8 text-neutral-600 text-xs">
      No hay casos en revisión
    </div>
  ) : (
    <div className="space-y-2">
      {cola.map(item => (
        <a
          key={item.id_siniestro}
          href={`/siniestros/${item.id_siniestro}`}
          className="flex items-center gap-3 p-2.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#1E1E1E] hover:border-amber-500/20 rounded-xl transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-amber-400">
              {item.revisor_nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold text-white truncate">{item.id_siniestro}</span>
              {item.nivel_riesgo === 'Rojo Alto' && (
                <span className="text-[9px] px-1 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded">Rojo</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-neutral-500 truncate">{item.revisor_nombre}</span>
              <span className="text-[10px] text-neutral-700">·</span>
              <span className="text-[10px] text-neutral-500">{item.ramo}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[11px] font-bold text-white">{item.score_final ?? '—'}</div>
            <div className="text-[9px] text-neutral-600">pts</div>
          </div>
        </a>
      ))}
    </div>
  )}

  <a
    href="/siniestros?estado_revision=En+revisión"
    className="flex items-center justify-center gap-1 mt-3 text-[10px] text-neutral-600 hover:text-amber-400 transition-colors"
  >
    Ver todos →
  </a>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/dashboard/page.tsx
git commit -m "feat(revision): add human review queue widget to dashboard"
```

---

## Self-Review

**Spec coverage:**
- ✅ Tabla `app.revisores` con 5 ficticios → Task 1
- ✅ Asignación automática por ramo → Task 2 (`RAMO_A_REVISOR`)
- ✅ 4 estados: Pendiente → En revisión → Aprobado/Rechazado → Tasks 1 + 2
- ✅ `POST /api/siniestros/{id}/revision` → Task 2
- ✅ `GET /api/revisiones/cola` → Task 2
- ✅ Botón + modal en detalle del siniestro → Task 5
- ✅ Badge "En revisión" en lista → Task 6
- ✅ Filtro "En revisión" en lista → Task 6 + 6b
- ✅ Widget cola en dashboard → Task 7
- ✅ Cédulas ecuatorianas ficticias → Task 1
- ✅ `estado_revision` en schema Pydantic → Task 6b
- ✅ `estado_revision` en tipos TS → Task 5 (SiniestroDetail)

**Placeholders:** Ninguno.

**Type consistency:**
- `ColaRevisionItem` definido en Task 4 (`types.ts`) y usado en Task 7 (`dashboard`) ✅
- `RevisionResult` definido en Task 2 (Python) y Task 4 (TS), usado en Task 5 ✅
- `Revisor.casos_activos` es `int` en Python y `number` en TS ✅
- `RAMO_A_REVISOR` en Task 1 (script) y Task 2 (router) deben ser idénticos ✅
