# Fraudia FE

Frontend web para **Fraudia AI**, una aplicación de análisis y priorización de siniestros con señales de riesgo antifraude y asistencia conversacional con IA.

El proyecto está construido con Angular 17 y consume un backend FastAPI. La aplicación permite cargar datasets, consultar siniestros, revisar scoring de riesgo, navegar indicadores ejecutivos y conversar con un agente antifraude contextual.

## Tabla de Contenido

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Comandos](#comandos)
- [Ambientes](#ambientes)
- [Arquitectura](#arquitectura)
- [Rutas Principales](#rutas-principales)
- [Módulos Funcionales](#módulos-funcionales)
- [Integración con Backend](#integración-con-backend)
- [Agente IA](#agente-ia)
- [Estado Local](#estado-local)
- [UI y Experiencia](#ui-y-experiencia)
- [Validación](#validación)
- [Notas de Mantenimiento](#notas-de-mantenimiento)

## Stack

- Angular `17.3`
- TypeScript estricto
- Standalone components
- Angular Router
- Reactive Forms y FormsModule
- HttpClient con interceptores
- RxJS `7.8`
- SCSS global
- Karma/Jasmine para pruebas unitarias

## Requisitos

- Node.js compatible con Angular 17
- npm
- Backend Fraudia disponible y accesible desde la URL configurada en `src/environments`

## Instalación

```bash
npm install
```

## Comandos

```bash
npm start
```

Levanta Angular en modo desarrollo. Usa la configuración `development`.

```bash
npm run start:dev
```

Alias explícito para desarrollo.

```bash
npm run start:test
```

Levanta la app usando el ambiente `test`.

```bash
npm run build
```

Genera build de producción en `dist/fraudia-fe`.

```bash
npm run build:prod
```

Build de producción explícito.

```bash
npm run watch
```

Compila en modo watch usando configuración de desarrollo.

```bash
npm test
```

Ejecuta pruebas unitarias con Karma/Jasmine.

## Ambientes

Los ambientes viven en:

```text
src/environments/
├── environment.ts
├── environment.development.ts
├── environment.test.ts
└── environment.production.ts
```

Configuración actual:

| Archivo | Uso | `apiBaseUrl` |
| --- | --- | --- |
| `environment.development.ts` | `npm start`, `npm run start:dev` | `https://734dm385-8000.brs.devtunnels.ms/api` |
| `environment.test.ts` | `npm run start:test` | `https://test-api.example.com/api/v1` |
| `environment.production.ts` | `npm run build`, `npm run build:prod` | `https://api.example.com/api/v1` |
| `environment.ts` | Base si no hay reemplazo de archivo | `https://734dm385-8000.brs.devtunnels.ms/api/v1` |

La app no arma URLs directamente dentro de los servicios de negocio. Todo pasa por:

```text
src/app/core/services/http-client.service.ts
```

Ese servicio concatena `environment.apiBaseUrl` con las rutas de:

```text
src/app/core/constants/api-endpoints.ts
```

Antes de desplegar, actualizar `environment.production.ts` con la URL real del backend.

## Arquitectura

La aplicación está organizada por capas:

```text
src/app/
├── core/
│   ├── config/
│   ├── constants/
│   ├── guards/
│   ├── interceptors/
│   ├── layout/
│   ├── models/
│   └── services/
├── features/
│   ├── agent/
│   ├── claims/
│   ├── dashboard/
│   ├── reports/
│   ├── rules/
│   └── uploads/
└── shared/
    ├── components/
    ├── pipes/
    └── utils/
```

### `core`

Contiene infraestructura transversal:

- Configuración de ambiente.
- Constantes de rutas y endpoints.
- Interceptores HTTP.
- Layout principal, sidebar, topbar y navegación móvil.
- Servicios de loading y notificaciones.
- Modelos compartidos.

### `features`

Contiene funcionalidades por dominio. Cada módulo agrupa páginas, componentes, modelos y servicios propios.

### `shared`

Contiene componentes reutilizables, pipes y utilidades de presentación.

## Rutas Principales

Las rutas están definidas en:

```text
src/app/app.routes.ts
```

| Ruta | Pantalla |
| --- | --- |
| `/dashboard` | Dashboard ejecutivo y bandeja resumida |
| `/uploads` | Carga de datasets |
| `/claims` | Listado paginado de siniestros |
| `/claims/:id` | Detalle de siniestro |
| `/rules` | Catálogo local de reglas |
| `/agent` | Chat principal del agente IA |
| `/reports` | Reportes ejecutivos |
| `**` | Redirección a `/dashboard` |

Todas las rutas principales usan `MainLayoutComponent`.

## Módulos Funcionales

### Dashboard

Pantalla principal para monitoreo ejecutivo.

Archivo principal:

```text
src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.ts
```

Consume:

- `GET /analytics/summary`
- `GET /risk/top`
- `GET /analytics/alerts`

Comportamiento actual:

- Carga inicial rápida con resumen y top de siniestros.
- El tab de análisis carga datos adicionales de forma lazy.
- Usa caché con `shareReplay(1)` en `DashboardService`.
- Permite filtrar los casos visibles por texto y nivel de riesgo.

### Carga de Datasets

Pantalla para importar archivos operativos.

Archivo principal:

```text
src/app/features/uploads/pages/upload-dataset-page/upload-dataset-page.component.ts
```

Consume:

- `POST /imports/file`

Formatos aceptados:

- CSV
- XLSX
- XLSM

Tipos de dataset seleccionables:

- Detección automática
- Siniestros
- Pólizas
- Asegurados
- Proveedores
- Vehículos
- Documentos

Después de la carga, el frontend muestra un resumen con los registros procesados. La evaluación batch se muestra como confirmación local porque el backend ya evalúa durante la importación.

### Siniestros

Listado operativo y detalle de casos.

Archivos principales:

```text
src/app/features/claims/pages/claims-list-page/claims-list-page.component.ts
src/app/features/claims/pages/claim-detail-page/claim-detail-page.component.ts
src/app/features/claims/services/claims.service.ts
```

Consume:

- `GET /claims`
- `GET /claims/{claim_id}`
- `POST /claims/{claim_id}/assess`

Listado:

- Paginación con `limit` y `offset`.
- Límite visible: `20`, `50`, `100`.
- Filtro por riesgo.
- Filtro crítico mapeado a `risk_level=rojo` y `min_score=90`.
- Ordenamiento cliente por score.

Detalle:

- Datos generales del siniestro.
- Score y recomendación.
- Alertas principales.
- Documentos.
- Información de póliza, proveedor y asegurado.
- Historial de revisión humana guardado localmente.
- Acceso directo al agente con `claim_id` en query param.

### Reglas

Catálogo visual de reglas antifraude.

Archivo principal:

```text
src/app/features/rules/services/rules.service.ts
```

Actualmente las reglas están definidas localmente en el frontend. No dependen de un endpoint del backend.

Reglas incluidas:

- Ventana sensible de vigencia
- Reporte tardío
- Frecuencia inusual
- Proveedor observado
- Documentos inconsistentes
- Narrativa similar
- Monto atípico
- Dinámica sospechosa

### Reportes

Resumen ejecutivo y casos críticos.

Archivos principales:

```text
src/app/features/reports/pages/reports-page/reports-page.component.ts
src/app/features/reports/services/reports.service.ts
```

Los reportes se derivan de `DashboardService`, no consumen endpoints propios.

Incluyen:

- Resumen ejecutivo de riesgo.
- Período de los últimos 30 días.
- Métricas agregadas.
- Recomendaciones.
- Top de casos críticos.

## Integración con Backend

Los endpoints se centralizan en:

```text
src/app/core/constants/api-endpoints.ts
```

| Dominio | Endpoint |
| --- | --- |
| Uploads | `POST /imports/file` |
| Claims | `GET /claims` |
| Claims | `GET /claims/{claim_id}` |
| Claims | `POST /claims/{claim_id}/assess` |
| Risk | `GET /risk/top` |
| Analytics | `GET /analytics/summary` |
| Analytics | `GET /analytics/providers` |
| Analytics | `GET /analytics/alerts` |
| Agent | `POST /agent/query` |

### Wrapper de respuesta

El backend puede responder con un wrapper:

```json
{
  "success": true,
  "message": null,
  "data": {},
  "error": null
}
```

`HttpClientService` detecta ese formato y devuelve directamente `data` a los servicios de negocio.

Si `success` es `false`, lanza error con el mensaje del backend.

### Interceptores

La app registra tres interceptores:

```text
AuthInterceptor
ErrorInterceptor
LoadingInterceptor
```

`AuthInterceptor`

- Lee `fraudia.authToken` desde `localStorage`.
- Si existe, agrega `Authorization: Bearer <token>`.

`ErrorInterceptor`

- Normaliza mensajes de error.
- Lee errores en formatos `detail`, `message` o `error.message`.
- Muestra notificaciones globales.
- Puede suprimir errores de sesión inválida del agente cuando el servicio va a reintentar.

`LoadingInterceptor`

- Muestra loader global en requests HTTP.
- Permite saltarlo con el contexto `SKIP_GLOBAL_LOADING`.
- El agente usa loader propio dentro del chat, no el overlay global.

## Agente IA

El agente usa:

```text
POST /agent/query
```

Modelo frontend:

```ts
interface AgentQueryRequest {
  question: string;
  claimId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  useLlm?: boolean | null;
}
```

Payload enviado al backend:

```json
{
  "question": "Explícame el riesgo de este siniestro",
  "claim_id": "SIN-0001",
  "session_id": "uuid-opcional",
  "user_id": "30802e66-afa3-4be1-9ef6-aa15baea763a",
  "use_llm": true
}
```

Decisiones actuales del frontend:

- `use_llm` se envía siempre como `true`.
- `user_id` está quemado como `30802e66-afa3-4be1-9ef6-aa15baea763a`.
- El `claim_id` se normaliza a mayúsculas.
- Las sesiones se guardan por código visible del siniestro.
- Si una sesión devuelve `422` por pertenecer a otro siniestro, se limpia la sesión local y se reintenta una vez sin `session_id`.
- Cada request del agente tiene timeout frontend de `25s`.
- El request del agente salta el loading global y muestra skeleton dentro del chat.

Respuesta esperada del backend:

```json
{
  "answer": "Resumen ejecutivo...",
  "session_id": "uuid-de-sesion",
  "claim_id": "uuid-interno-del-backend",
  "sources": ["scores_fraude", "alertas", "siniestros"],
  "used_llm": true,
  "disclaimer": "La respuesta es una alerta de apoyo analitico y requiere revision humana."
}
```

### Chat principal

Ruta:

```text
/agent
```

Puede recibir contexto por query param:

```text
/agent?claim_id=SIN-0001
```

Cuando tiene `claim_id`, el chat conserva la sesión de ese siniestro y envía el código visible en cada consulta.

### Chat flotante

Componente:

```text
src/app/shared/components/chat-widget/chat-widget.component.ts
```

El chat flotante es contextual:

- En pantallas generales trabaja como asistente global.
- En `/claims/:id` toma automáticamente el siniestro de la URL.
- Si el usuario escribe un código como `SIN-0004`, usa ese siniestro como contexto manual.
- Muestra un chip: `Contexto: Global` o `Contexto: SIN-0004`.
- Mantiene sesiones separadas por contexto para no mezclar conversaciones globales y conversaciones de siniestro.

### Render de respuestas

Componente:

```text
src/app/features/agent/components/chat-message/chat-message.component.ts
```

El componente formatea respuestas del agente:

- Título.
- Secciones.
- Párrafos.
- Bullets.
- Listas numeradas.
- Labels en negrita.
- Fuentes amigables.

`sources` no son URLs. Son tablas o módulos internos del backend. El frontend las muestra como:

- `siniestros` -> `siniestro`
- `scores_fraude` -> `score`
- `alertas` -> `alertas`
- `polizas` -> `poliza`
- `asegurados` -> `asegurado`
- `proveedores` -> `proveedor`
- `documentos` -> `documentos`
- `vehiculos` -> `vehiculo`

Se ocultan fuentes técnicas como:

- `sesiones_chat`
- `mensajes_chat`

## Estado Local

La app usa `localStorage` para algunos datos de apoyo:

| Key | Uso |
| --- | --- |
| `fraudia.authToken` | Token opcional para Authorization |
| `fraudia.agent.session.<CLAIM_CODE>` | Sesión del agente por siniestro |
| `fraudia.reviews.<CLAIM_ID>` | Historial local de revisión humana |

El historial de revisión humana todavía es local. Si el backend agrega endpoints de revisión, esa lógica debe moverse a un servicio HTTP.

## UI y Experiencia

La interfaz incluye:

- Layout con sidebar, topbar y navegación móvil.
- Dashboard con métricas, bandeja de casos y análisis lazy.
- Loader global para requests normales.
- Skeleton inline para respuestas del agente.
- Mensajes de error recuperables en el chat cuando el agente tarda demasiado.
- Formateo visual de respuestas ejecutivas del agente.
- Chat flotante disponible desde el layout principal.

Los estilos principales están en:

```text
src/styles.scss
```

## Validación

Comando recomendado antes de entregar cambios:

```bash
npm run build
```

También se pueden correr pruebas unitarias:

```bash
npm test
```
