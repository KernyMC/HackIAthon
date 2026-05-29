# fraudIA - Detector de Posibles Fraudes en Siniestros

**Prototipo funcional basado en IA para detectar patrones de posible fraude en siniestros de seguros.**

---

## Estructura Clara (Frontend + Backend separados)

El proyecto está dividido para que sea **muy fácil de ejecutar**:

```
Fraudia/
├── backend/          ← Todo el código Python (ML, pipeline, reglas, modelos...)
├── frontend/         ← La aplicación React (Home profesional del sitio)
├── design/           ← Scripts y prompts de generación de assets (solo para diseño)
├── docs/             ← Documentación técnica
└── README.md
```

### Cómo ejecutar (muy simple)

#### 1. Backend (Python)

```bash
cd backend
pip install -r requirements.txt

# Ejecutar pipeline completo
python -m src.pipeline.run_all

# O ejecutar la app (cuando esté implementada)
# python -m src.app.main
```

#### 2. Frontend (React - El Home del sitio)

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**

Este es el sitio profesional que se presenta en el hackIAthon.

---

## ✨ Home Profesional del Sitio (React)

El frontend es un sitio **full-bleed profesional** con:

- Diseño que usa todo el contorno del navegador
- Video `fraudia-hero-sphere-loop.mp4` como animación 3D interactiva a la derecha del Hero
- Logo y marca muy visibles
- Demo en vivo del motor de scoring real
- Alta calidad visual (siguiendo las mejores prácticas de diseño)

**Comando rápido:**
```bash
cd frontend
npm install && npm run dev
```

---

## Backend (Python / ML)

Todo el sistema de detección de fraude vive en `backend/`:

- `DataEnt/` → Fuente de verdad con los CSV actuales
- `src/` → Código modular para ingesta, features, reglas, entrenamiento y scoring
- `models/` → Artefactos entrenados y registro del experimento
- `reports/` → Gráficos comparativos para justificar la elección de modelos
- `data/processed/` → Salidas intermedias si se necesitan en futuras iteraciones

El backend ya no depende del dataset sintético viejo para entrenar.
La idea es tomar `DataEnt`, construir variables de riesgo y comparar 4 modelos para quedarse con el top 3 de mejor desempeño.

## Arquitectura

```
fraudIA/
├── DataEnt/                 # Fuente actual de datos
├── data/
│   ├── raw/
│   ├── processed/
│   └── synthetic/           # Carpeta obsoleta de la etapa anterior
├── docs/                    # Documentación técnica
├── models/                  # Modelos entrenados y scoring
├── notebooks/               # Espacio para análisis futuros
├── reports/                 # Reportes y gráficos de evaluación
├── src/                     # Pipeline y módulos del backend
├── requirements.txt
└── README.md
```

## Flujo de entrenamiento

1. Leer los CSV de `backend/DataEnt/`
2. Normalizar columnas y cruzar tablas
3. Construir variables de riesgo
4. Generar un label heurístico para entrenamiento y evaluación
5. Entrenar 4 modelos
6. Comparar métricas y conservar el top 3
7. Exportar gráficos y artefactos

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecución

### 1. Pipeline completo (cargar DataEnt + preprocesar + reentrenar)

```bash
python -m src.pipeline.run_all
```

### 2. Artefactos generados

- `backend/models/training_summary.json`
- `backend/models/scored_claims.csv`
- `backend/reports/metrics_comparison.png`
- `backend/reports/roc_comparison.png`
- `backend/reports/pr_comparison.png`
- `backend/reports/confusion_matrices.png`
- `backend/reports/confusion_test_best.png`
- `backend/reports/feature_importance.png`
- `backend/reports/risk_rule_distribution.png`
- `backend/reports/model_probability_distribution.png`

## Score de Riesgo

| Rango  | Nivel  | Acción                                |
|--------|--------|---------------------------------------|
| 0-40   | 🟢 Bajo | Continuar flujo normal               |
| 41-75  | 🟡 Medio| Escalar a Unidad Antifraude          |
| 76-100 | 🔴 Alto | Revisión especializada de campo      |
