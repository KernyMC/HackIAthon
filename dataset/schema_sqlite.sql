-- SQLite schema for FraudIA Claims synthetic dataset.
-- Load CSVs into these tables or use pandas directly.

CREATE TABLE asegurados (
  id_asegurado TEXT PRIMARY KEY,
  segmento TEXT,
  antiguedad_meses INTEGER,
  ciudad TEXT,
  numero_polizas INTEGER,
  reclamos_ultimos_12_meses INTEGER,
  mora_actual TEXT,
  score_cliente_simulado INTEGER
);

CREATE TABLE vehiculos (
  id_vehiculo TEXT PRIMARY KEY,
  placa_hash TEXT,
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  chasis_hash TEXT,
  motor_hash TEXT,
  ciudad TEXT,
  uso TEXT
);

CREATE TABLE conductores (
  id_conductor TEXT PRIMARY KEY,
  rango_edad TEXT,
  antiguedad_licencia_anios INTEGER,
  ciudad TEXT,
  relacion_asegurado TEXT
);

CREATE TABLE polizas (
  id_poliza TEXT PRIMARY KEY,
  id_asegurado TEXT,
  id_vehiculo TEXT,
  ramo TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  prima REAL,
  suma_asegurada REAL,
  deducible REAL,
  canal_venta TEXT,
  ciudad TEXT,
  estado_poliza TEXT,
  plan_producto TEXT
);

CREATE TABLE proveedores (
  id_proveedor TEXT PRIMARY KEY,
  nombre_proveedor TEXT,
  tipo TEXT,
  ciudad TEXT,
  reclamos_asociados INTEGER,
  monto_promedio_reclamado REAL,
  porcentaje_casos_observados REAL,
  en_lista_restrictiva TEXT,
  casos_observados_ultimo_anio INTEGER,
  antiguedad_meses INTEGER
);

CREATE TABLE siniestros_scored (
  id_siniestro TEXT PRIMARY KEY,
  id_poliza TEXT,
  id_asegurado TEXT,
  id_vehiculo TEXT,
  id_conductor TEXT,
  id_proveedor TEXT,
  ramo TEXT,
  cobertura TEXT,
  fecha_ocurrencia DATE,
  fecha_reporte DATE,
  monto_reclamado REAL,
  monto_estimado REAL,
  monto_pagado REAL,
  estado TEXT,
  sucursal TEXT,
  ciudad TEXT,
  descripcion TEXT,
  documentos_completos TEXT,
  beneficiario TEXT,
  dias_desde_inicio_poliza INTEGER,
  dias_desde_fin_poliza INTEGER,
  dias_entre_ocurrencia_reporte INTEGER,
  historial_siniestros_asegurado INTEGER,
  historial_siniestros_vehiculo INTEGER,
  historial_siniestros_conductor INTEGER,
  historial_solo_rc_asegurado INTEGER,
  tipo_impacto TEXT,
  hora_evento INTEGER,
  tercero_identificado TEXT,
  evidencia_camaras TEXT,
  tipo_via TEXT,
  clima TEXT,
  documento_inconsistente TEXT,
  relato_ilogico TEXT,
  narrativa_cluster_id TEXT,
  similitud_narrativa_max REAL,
  etiqueta_fraude_simulada INTEGER,
  perfil_riesgo_generacion TEXT,
  suma_asegurada REAL,
  deducible REAL,
  canal_venta TEXT,
  proveedor_en_lista_restrictiva TEXT,
  proveedor_casos_observados_ultimo_anio INTEGER,
  ratio_monto_suma_asegurada REAL,
  score_reglas REAL,
  score_modelo_simulado REAL,
  score_final REAL,
  nivel_riesgo TEXT,
  alertas_activadas TEXT,
  reglas_criticas_activadas TEXT,
  accion_sugerida TEXT
);

CREATE TABLE documentos (
  id_documento TEXT PRIMARY KEY,
  id_siniestro TEXT,
  tipo_documento TEXT,
  entregado TEXT,
  legible TEXT,
  fecha_emision DATE,
  inconsistencia_detectada TEXT,
  observacion TEXT
);
