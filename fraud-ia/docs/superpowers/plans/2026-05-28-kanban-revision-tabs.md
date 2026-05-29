# Kanban Revisión Humana + Tabs Siniestros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un tablero Kanban en el dashboard agrupado por revisor (con acciones Aprobar/Rechazar/Reasignar inline), y tabs de estado de revisión en la lista de siniestros.

**Architecture:** Nuevo endpoint `PATCH /api/siniestros/{id}/revision` que acepta `accion` (aprobar/rechazar/reasignar) y `id_revisor_nuevo` opcional. Nuevo endpoint `GET /api/revisiones/kanban` que agrupa casos por revisor. El Kanban vive en el dashboard como widget nuevo; los tabs reemplazan el chip "En revisión" actual en `/siniestros`.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic v2, Next.js 15, TypeScript, Tailwind, Lucide icons. Estados posibles: `Pendiente` → `En revisión` → `Aprobado` / `Rechazado`.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/api/app/revision/schemas.py` | Modificar | Agregar `KanbanColumn`, `RevisionAccion` |
| `apps/api/app/revision/router.py` | Modificar | PATCH resolver/reasignar + GET kanban |
| `apps/web/lib/types.ts` | Modificar | Agregar `KanbanColumn`, `RevisionAccionPayload` |
| `apps/web/lib/api.ts` | Modificar | Agregar `resolverRevision()`, `getKanban()` |
| `apps/web/app/dashboard/page.tsx` | Modificar | Widget Kanban con columnas por revisor |
| `apps/web/app/siniestros/page.tsx` | Modificar | Reemplazar chip por tabs de estado |

---

## Task 1: Backend — schemas nuevos

**Files:**
- Modify: `apps/api/app/revision/schemas.py`

- [ ] **Step 1: Leer el archivo actual**

```bash
cat /home/kernyvpa/AI-Projects/fraud-ia/apps/api/app/revision/schemas.py
```

- [ ] **Step 2: Agregar los dos schemas nuevos al final del archivo**

```python
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
```

- [ ] **Step 3: Verificar sintaxis**

```bash
cd /home/kernyvpa/AI-Projects/fraud-ia/apps/api
python3 -c "from app.revision.schemas import RevisionAccion, KanbanColumn, KanbanCard; print('OK')"
```

Esperado: `OK`

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/revision/schemas.py
git commit -m "feat(kanban): add RevisionAccion and KanbanColumn schemas"
```

---

## Task 2: Backend — endpoints PATCH + GET kanban

**Files:**
- Modify: `apps/api/app/revision/router.py`

- [ ] **Step 1: Leer el archivo actual**

```bash
cat /home/kernyvpa/AI-Projects/fraud-ia/apps/api/app/revision/router.py
```

- [ ] **Step 2: Agregar import de Body y los schemas nuevos**

En el bloque de imports de `router.py`, agregar `Body` a los imports de fastapi y los nuevos schemas:

```python
from fastapi import APIRouter, Body, Depends, HTTPException
from .schemas import RevisionResult, Revisor, ColaRevisionItem, RevisionAccion, KanbanColumn, KanbanCard
```

- [ ] **Step 3: Agregar endpoint PATCH para resolver/reasignar**

Al final de `router.py`, después de `get_revisores`:

```python
@router.patch("/siniestros/{id_siniestro}/revision", response_model=dict)
def resolver_revision(
    id_siniestro: str,
    payload: RevisionAccion,
    db: Session = Depends(get_db),
):
    sin = db.execute(
        text("SELECT id_siniestro, estado_revision, id_revisor_asignado FROM claims.siniestros WHERE id_siniestro = :id"),
        {"id": id_siniestro},
    ).mappings().first()
    if not sin:
        raise HTTPException(status_code=404, detail="Siniestro no encontrado")
    if sin["estado_revision"] not in ("En revisión",):
        raise HTTPException(status_code=409, detail="El siniestro no está en revisión")

    if payload.accion == "aprobar":
        db.execute(
            text("UPDATE claims.siniestros SET estado_revision = 'Aprobado' WHERE id_siniestro = :id"),
            {"id": id_siniestro},
        )
        db.execute(
            text("UPDATE app.revisores SET casos_activos = GREATEST(casos_activos - 1, 0) WHERE id_revisor = :rev"),
            {"rev": sin["id_revisor_asignado"]},
        )
        db.commit()
        return {"mensaje": "Siniestro aprobado", "estado_revision": "Aprobado"}

    elif payload.accion == "rechazar":
        db.execute(
            text("UPDATE claims.siniestros SET estado_revision = 'Rechazado' WHERE id_siniestro = :id"),
            {"id": id_siniestro},
        )
        db.execute(
            text("UPDATE app.revisores SET casos_activos = GREATEST(casos_activos - 1, 0) WHERE id_revisor = :rev"),
            {"rev": sin["id_revisor_asignado"]},
        )
        db.commit()
        return {"mensaje": "Siniestro rechazado", "estado_revision": "Rechazado"}

    elif payload.accion == "reasignar":
        if not payload.id_revisor_nuevo:
            raise HTTPException(status_code=422, detail="id_revisor_nuevo requerido para reasignar")
        rev_nuevo = db.execute(
            text("SELECT id_revisor FROM app.revisores WHERE id_revisor = :id"),
            {"id": payload.id_revisor_nuevo},
        ).first()
        if not rev_nuevo:
            raise HTTPException(status_code=404, detail="Revisor no encontrado")
        db.execute(
            text("UPDATE app.revisores SET casos_activos = GREATEST(casos_activos - 1, 0) WHERE id_revisor = :rev"),
            {"rev": sin["id_revisor_asignado"]},
        )
        db.execute(
            text("""
                UPDATE claims.siniestros
                SET id_revisor_asignado = :nuevo, fecha_asignacion = NOW()
                WHERE id_siniestro = :id
            """),
            {"nuevo": payload.id_revisor_nuevo, "id": id_siniestro},
        )
        db.execute(
            text("UPDATE app.revisores SET casos_activos = casos_activos + 1 WHERE id_revisor = :rev"),
            {"rev": payload.id_revisor_nuevo},
        )
        db.commit()
        return {"mensaje": "Reasignado correctamente", "id_revisor_nuevo": payload.id_revisor_nuevo}

    raise HTTPException(status_code=422, detail="accion debe ser 'aprobar', 'rechazar' o 'reasignar'")
```

- [ ] **Step 4: Agregar endpoint GET kanban**

```python
@router.get("/revisiones/kanban", response_model=list[KanbanColumn])
def get_kanban(db: Session = Depends(get_db)):
    revisores = db.execute(
        text("SELECT id_revisor, nombre, especialidad, email, casos_activos FROM app.revisores ORDER BY especialidad")
    ).mappings().all()

    result = []
    for rev in revisores:
        rows = db.execute(
            text("""
                SELECT
                    s.id_siniestro, s.ramo, s.ciudad,
                    s.score_final, s.nivel_riesgo,
                    s.monto_reclamado, s.fecha_asignacion,
                    EXTRACT(DAY FROM NOW() - s.fecha_asignacion)::int AS dias_en_cola
                FROM claims.siniestros s
                WHERE s.id_revisor_asignado = :rev
                  AND s.estado_revision = 'En revisión'
                ORDER BY s.score_final DESC NULLS LAST
            """),
            {"rev": rev["id_revisor"]},
        ).mappings().all()

        cards = [
            KanbanCard(
                id_siniestro=r["id_siniestro"],
                ramo=r["ramo"] or "—",
                ciudad=r["ciudad"],
                score_final=float(r["score_final"]) if r["score_final"] else None,
                nivel_riesgo=r["nivel_riesgo"],
                monto_reclamado=float(r["monto_reclamado"]) if r["monto_reclamado"] else None,
                fecha_asignacion=r["fecha_asignacion"],
                dias_en_cola=r["dias_en_cola"] or 0,
            )
            for r in rows
        ]
        result.append(KanbanColumn(revisor=Revisor(**dict(rev)), casos=cards))
    return result
```

- [ ] **Step 5: Verificar sintaxis**

```bash
cd /home/kernyvpa/AI-Projects/fraud-ia/apps/api
python3 -c "from app.revision.router import router; print('OK')"
```

Esperado: `OK`

- [ ] **Step 6: Test rápido del endpoint**

```bash
# Primero asegurar que hay un caso en revisión
curl -s -X POST http://localhost:8080/api/siniestros/SIN-00083/revision | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('estado_revision','error'))"
# Luego testear kanban
curl -s http://localhost:8080/api/revisiones/kanban | python3 -c "import json,sys; cols=json.load(sys.stdin); [print(c['revisor']['nombre'], len(c['casos']), 'casos') for c in cols]"
```

Esperado: líneas con nombre de revisor y conteo de casos.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/revision/router.py
git commit -m "feat(kanban): add PATCH resolver/reasignar + GET /api/revisiones/kanban"
```

---

## Task 3: Frontend — tipos y funciones API

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Agregar tipos al final de `types.ts`**

```typescript
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
```

- [ ] **Step 2: Agregar funciones a `api.ts`**

Agregar `KanbanColumn` y `RevisionAccionPayload` al import de `./types` en `api.ts`.

Agregar antes de `healthCheck`:

```typescript
export async function getKanban(): Promise<KanbanColumn[]> {
  return apiFetch<KanbanColumn[]>('/api/revisiones/kanban')
}

export async function resolverRevision(
  idSiniestro: string,
  payload: RevisionAccionPayload,
): Promise<{ mensaje: string; estado_revision?: string; id_revisor_nuevo?: string }> {
  return apiFetch(`/api/siniestros/${encodeURIComponent(idSiniestro)}/revision`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/api.ts
git commit -m "feat(kanban): add KanbanColumn types and getKanban/resolverRevision API calls"
```

---

## Task 4: Dashboard — widget Kanban

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Agregar imports**

En los imports de `dashboard/page.tsx`, agregar:
- `getKanban`, `resolverRevision`, `getRevisores` al import de `@/lib/api`
- `KanbanColumn`, `RevisionAccionPayload` al import de `@/lib/types`
- `Check`, `XCircle`, `RefreshCcw` al import de `lucide-react`

- [ ] **Step 2: Agregar estado y fetch del kanban**

Dentro del componente Dashboard, después de los otros useState:

```typescript
const [kanban, setKanban]           = useState<KanbanColumn[]>([])
const [revisores, setRevisores]     = useState<Revisor[]>([])
const [kanbanLoading, setKanbanLoading] = useState(false)

const fetchKanban = useCallback(async () => {
  try {
    const [cols, revs] = await Promise.all([getKanban(), getRevisores()])
    setKanban(cols)
    setRevisores(revs)
  } catch { /* silent */ }
}, [])

useEffect(() => { fetchKanban() }, [fetchKanban])

const handleRevisionAccion = async (
  idSiniestro: string,
  accion: RevisionAccionPayload['accion'],
  idRevisorNuevo?: string,
) => {
  setKanbanLoading(true)
  try {
    await resolverRevision(idSiniestro, { accion, id_revisor_nuevo: idRevisorNuevo })
    await fetchKanban()
  } catch { /* silent */ } finally {
    setKanbanLoading(false)
  }
}
```

- [ ] **Step 3: Agregar el widget Kanban**

Localizar el comentario `{/* ── Cola de Revisión Humana */}` y agregar DESPUÉS del cierre de ese widget el siguiente widget:

```tsx
{/* ── Kanban Revisión por Revisor ─────────────────────────── */}
<div className="grid-stack-item" gs-x={0} gs-y={21} gs-w={12} gs-h={6}>
  <div className="grid-stack-item-content">
    <div className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-2xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span className="text-[13px] font-semibold text-white">Tablero de Revisión · Por Analista</span>
          <Tooltip
            title={<span style={{ fontSize: 11, lineHeight: 1.5 }}>Casos en revisión agrupados por analista asignado. Aprueba, rechaza o reasigna sin salir del dashboard.</span>}
            placement="right" arrow
            slotProps={{ tooltip: { sx: { bgcolor: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 2, maxWidth: 220, p: 1.5 } }, arrow: { sx: { color: '#1A1A1A' } } }}
          >
            <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
          </Tooltip>
        </div>
        <button
          onClick={fetchKanban}
          disabled={kanbanLoading}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1C1C1C] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${kanbanLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Columnas Kanban */}
      <div className="flex gap-3 overflow-x-auto flex-1 min-h-0 pb-1">
        {kanban.map(col => (
          <div
            key={col.revisor.id_revisor}
            className="flex-shrink-0 w-56 flex flex-col bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden"
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-[#1E1E1E] bg-[#111] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-amber-400">
                      {col.revisor.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">{col.revisor.nombre.split(' ')[0]}</p>
                    <p className="text-[9px] text-neutral-600 truncate">{col.revisor.especialidad}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {col.casos.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {col.casos.length === 0 && (
                <p className="text-[10px] text-neutral-700 text-center py-4">Sin casos asignados</p>
              )}
              {col.casos.map(card => {
                const scoreColor = (card.score_final ?? 0) >= 70 ? '#ef4444'
                  : (card.score_final ?? 0) >= 40 ? '#eab308' : '#22c55e'
                return (
                  <div
                    key={card.id_siniestro}
                    className="bg-[#1A1A1A] border border-[#252525] rounded-lg p-2.5 space-y-2"
                  >
                    {/* ID + score */}
                    <div className="flex items-center justify-between">
                      <a
                        href={`/siniestros/${card.id_siniestro}`}
                        className="text-[10px] font-mono font-bold text-white hover:text-[#C8FF00] transition-colors truncate"
                      >
                        {card.id_siniestro}
                      </a>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: scoreColor }}>
                        {card.score_final?.toFixed(0) ?? '—'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="text-[9px] text-neutral-500 space-y-0.5">
                      <p className="truncate">{card.ramo} · {card.ciudad ?? '—'}</p>
                      <p>{card.dias_en_cola} día{card.dias_en_cola !== 1 ? 's' : ''} en cola</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRevisionAccion(card.id_siniestro, 'aprobar')}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] font-semibold bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 rounded transition-all"
                        title="Aprobar"
                      >
                        <Check className="w-2.5 h-2.5" /> Aprobar
                      </button>
                      <button
                        onClick={() => handleRevisionAccion(card.id_siniestro, 'rechazar')}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded transition-all"
                        title="Rechazar"
                      >
                        <XCircle className="w-2.5 h-2.5" /> Rechazar
                      </button>
                    </div>

                    {/* Reassign dropdown */}
                    <select
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) {
                          handleRevisionAccion(card.id_siniestro, 'reasignar', e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="w-full text-[9px] bg-[#111] border border-[#2A2A2A] text-neutral-500 rounded px-1.5 py-1 focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="">Reasignar a...</option>
                      {revisores
                        .filter(r => r.id_revisor !== col.revisor.id_revisor)
                        .map(r => (
                          <option key={r.id_revisor} value={r.id_revisor}>
                            {r.nombre.split(' ')[0]} ({r.especialidad})
                          </option>
                        ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Agregar `Check`, `XCircle`, `RefreshCcw` a imports de lucide**

En la línea de imports de lucide-react, agregar `Check`, `XCircle` (ya puede existir `RefreshCw`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/dashboard/page.tsx
git commit -m "feat(kanban): add Kanban board widget with approve/reject/reassign actions"
```

---

## Task 5: Siniestros lista — tabs de estado de revisión

**Files:**
- Modify: `apps/web/app/siniestros/page.tsx`

- [ ] **Step 1: Leer el archivo para ubicar la zona de filtros**

Buscar la línea con `<Select value={nivelRiesgo}` y los chips de filtro actuales (alrededor de la línea 300).

- [ ] **Step 2: Agregar estado `estadoRevision` separado del `nivelRiesgo`**

Dentro del componente, después de `const [nivelRiesgo, setNivelRiesgo]`:

```typescript
const [estadoRevision, setEstadoRevision] = useState<string>(() =>
  searchParams.get('estado_revision') ?? 'todos'
)
```

- [ ] **Step 3: Actualizar `fetchData` para usar `estadoRevision`**

En la función `fetchData`, reemplazar la lógica de `nivelRiesgo === 'revision'` por:

```typescript
if (estadoRevision !== 'todos') {
  params.estado_revision = estadoRevision
} else if (nivelRiesgo !== 'all') {
  params.nivel_riesgo = nivelRiesgo
}
```

Y agregar `estadoRevision` al array de dependencias del `useCallback` y al `useEffect`.

- [ ] **Step 4: Reemplazar el chip "En revisión" por las 5 tabs**

Buscar el botón que tiene `'revision'` en el onClick y reemplazarlo junto con el `<Select>` de nivel de riesgo por este bloque de tabs:

```tsx
{/* Tabs de estado de revisión */}
<div className="flex gap-1 flex-wrap">
  {[
    { value: 'todos',       label: 'Todos',        color: 'text-neutral-400' },
    { value: 'Pendiente',   label: 'Sin revisar',  color: 'text-neutral-400' },
    { value: 'En revisión', label: 'En revisión',  color: 'text-amber-400'   },
    { value: 'Aprobado',    label: 'Aprobados',    color: 'text-green-400'   },
    { value: 'Rechazado',   label: 'Rechazados',   color: 'text-red-400'     },
  ].map(tab => (
    <button
      key={tab.value}
      onClick={() => { setEstadoRevision(tab.value); setPage(0) }}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
        estadoRevision === tab.value
          ? `bg-[#1C1C1C] border-[#3A3A3A] ${tab.color}`
          : 'bg-[#141414] border-[#2A2A2A] text-neutral-600 hover:text-white hover:border-[#3A3A3A]'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

Mantener el `<Select>` de nivel de riesgo (Verde/Amarillo/Rojo) para filtrar por score, que es ortogonal al estado de revisión.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/siniestros/page.tsx
git commit -m "feat(siniestros): replace revision chip with 5-tab status filter"
```

---

## Self-Review

**Spec coverage:**
- ✅ Kanban agrupado por revisor → Task 4
- ✅ Cards con ID + score + ramo + días en cola → Task 4
- ✅ Acción Aprobar inline → Task 2 (PATCH) + Task 4 (botón)
- ✅ Acción Rechazar inline → Task 2 (PATCH) + Task 4 (botón)
- ✅ Acción Reasignar con dropdown → Task 2 (PATCH) + Task 4 (select)
- ✅ Tabs: Todos / Sin revisar / En revisión / Aprobados / Rechazados → Task 5
- ✅ Estados `Aprobado` y `Rechazado` en BD → Task 2 (UPDATE)
- ✅ Decremento de `casos_activos` al resolver → Task 2
- ✅ Incremento/decremento al reasignar → Task 2

**Placeholders:** Ninguno.

**Type consistency:**
- `KanbanCard` definido en Task 1 (Python) y Task 3 (TS) — ✅
- `KanbanColumn` definido en Task 1 (Python) y Task 3 (TS) — ✅
- `RevisionAccion.accion` es `str` en Python; `RevisionAccionPayload.accion` es union literal en TS — ✅
- `resolverRevision()` en Task 3 usa `RevisionAccionPayload` — mismo tipo usado en Task 4 — ✅
- `handleRevisionAccion` en Task 4 usa `RevisionAccionPayload['accion']` — coincide con Task 3 — ✅
- `estadoRevision` de Task 5 alimenta `params.estado_revision` que el backend ya acepta (implementado en sesión anterior) — ✅
