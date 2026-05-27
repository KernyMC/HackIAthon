# FraudIA Claims - Dataset sintetico

Dataset sintetico para un MVP de deteccion de posibles fraudes en siniestros de seguros.

## Uso recomendado

Archivo principal para dashboard/modelo: `siniestros_scored.csv`.

Archivos complementarios:

- `siniestros.csv`: siniestros base sin scoring final.
- `polizas.csv`: datos sinteticos de polizas.
- `asegurados.csv`: asegurados anonimizados y sinteticos.
- `vehiculos.csv`: vehiculos con placa/chasis/motor hash sinteticos.
- `conductores.csv`: conductores anonimos sinteticos.
- `proveedores.csv`: talleres, clinicas, peritos y proveedores ficticios.
- `documentos.csv`: documentos de soporte por siniestro.
- `narrativas_similares.csv`: pares de narrativas similares para demo NLP.
- `rubrica_score.csv`: reglas de score implementadas.
- `diccionario_datos.csv`: diccionario de campos.
- `manifest.json`: resumen del dataset.

## Volumen

- Siniestros: 1000
- Siniestros scored: 1000
- Polizas: 520
- Asegurados: 350
- Vehiculos: 420
- Conductores: 480
- Proveedores: 60
- Documentos: 3496
- Pares de narrativas similares: 180

## Distribucion de riesgo

{
  "Verde Bajo": 712,
  "Rojo Alto": 84,
  "Amarillo Medio": 204
}

## Nota etica

Este dataset es 100% sintetico. No contiene datos personales reales. El score debe usarse solo como alerta de revision humana, no como acusacion ni decision automatica sobre un reclamo.

## Ejemplo de ejecucion en Streamlit

```bash
pip install pandas streamlit scikit-learn plotly google-adk google-generativeai
streamlit run src/app/main.py
```
