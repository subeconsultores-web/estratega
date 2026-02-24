# Archivo de Consultas SQL (Stand-alone) para configurar Views en BigQuery
# Ejecutar en Google Cloud Console -> BigQuery -> Workspace

-- Vista Consolidada de Proyectos y Presupuestos (Eficiencia)
CREATE OR REPLACE VIEW `firestore_export.vw_estado_proyectos` AS
SELECT
  document_id as proyecto_id,
  JSON_EXTRACT_SCALAR(data, '$.tenantId') as tenant_id,
  JSON_EXTRACT_SCALAR(data, '$.nombre') as nombre_proyecto,
  JSON_EXTRACT_SCALAR(data, '$.estado') as estado,
  CAST(JSON_EXTRACT_SCALAR(data, '$.horasEstimadas') AS FLOAT64) as horas_estimadas,
  CAST(JSON_EXTRACT_SCALAR(data, '$.horasReales') AS FLOAT64) as horas_reales,
  CAST(JSON_EXTRACT_SCALAR(data, '$.presupuesto') AS FLOAT64) as presupuesto,
  CAST(JSON_EXTRACT_SCALAR(data, '$.montoFacturado') AS FLOAT64) as monto_facturado,
  JSON_EXTRACT_SCALAR(data, '$.enRiesgo') = 'true' as en_riesgo,
  timestamp
FROM
  `firestore_export.proyectos_raw_latest`
WHERE 
  operation != 'DELETE';

-- Vista de Lead Scoring (Clientes)
CREATE OR REPLACE VIEW `firestore_export.vw_lead_scoring` AS
SELECT
  document_id as cliente_id,
  JSON_EXTRACT_SCALAR(data, '$.tenantId') as tenant_id,
  JSON_EXTRACT_SCALAR(data, '$.nombre') as nombre_cliente,
  JSON_EXTRACT_SCALAR(data, '$.tipo') as tipo,
  CAST(JSON_EXTRACT_SCALAR(data, '$.score') AS FLOAT64) as lead_score,
  timestamp
FROM
  `firestore_export.clientes_raw_latest`
WHERE 
  operation != 'DELETE';

-- Vista de Flujo de Caja (Facturas)
CREATE OR REPLACE VIEW `firestore_export.vw_flujo_caja` AS
SELECT
  document_id as factura_id,
  JSON_EXTRACT_SCALAR(data, '$.tenantId') as tenant_id,
  JSON_EXTRACT_SCALAR(data, '$.estado') as estado,
  CAST(JSON_EXTRACT_SCALAR(data, '$.total') AS FLOAT64) as monto_total,
  CAST(JSON_EXTRACT_SCALAR(data, '$.fechaEmision') AS TIMESTAMP) as fecha_emision,
  CAST(JSON_EXTRACT_SCALAR(data, '$.fechaVencimiento') AS TIMESTAMP) as fecha_vencimiento,
  timestamp
FROM
  `firestore_export.facturas_raw_latest`
WHERE 
  operation != 'DELETE';
