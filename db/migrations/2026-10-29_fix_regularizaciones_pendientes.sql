SET NAMES utf8mb4;
USE SistemaPermisos;

-- Solo las salidas que aún están pendientes de regularización.
-- Antes la vista incluía solicitudes ya regularizadas que seguían en trámite
-- (PENDIENTE, APROBADA_JEFE, etc.), por eso reaparecían en la pantalla.
CREATE OR REPLACE VIEW vw_regularizaciones_pendientes AS
SELECT
  sol.id_solicitud,
  sol.nro_solicitud,
  sol.id_servidor,
  s.dni,
  CONCAT(s.apellidos, ', ', s.nombres) AS nombre_completo,
  CONCAT(s.apellidos, ', ', s.nombres) AS servidor,
  c.nombre AS cargo,
  COALESCE(sol.id_unidad_solicitud, s.id_unidad) AS id_unidad,
  u.nombre AS unidad,
  sol.id_tipo,
  t.codigo AS tipo_codigo,
  t.nombre AS tipo_nombre,
  sol.fecha_inicio,
  sol.fecha_fin,
  sol.hora_inicio,
  sol.hora_fin,
  sol.cantidad,
  sol.motivo,
  sol.estado,
  sol.es_urgente,
  sol.fecha_limite_regularizacion,
  (TO_DAYS(sol.fecha_limite_regularizacion) - TO_DAYS(CURDATE())) AS dias_restantes,
  (CASE
    WHEN sol.fecha_limite_regularizacion IS NULL THEN 0
    WHEN sol.fecha_limite_regularizacion < CURDATE() THEN 1
    ELSE 0
  END) AS vencida,
  sol.id_jefe_solicitud,
  sol.creado_en,
  sol.actualizado_en
FROM permiso_solicitud_papeleta sol
JOIN permiso_servidor s ON s.id_servidor = sol.id_servidor
LEFT JOIN permiso_cargo c ON c.id_cargo = COALESCE(sol.id_cargo_solicitud, s.id_cargo)
JOIN permiso_unidad_organica u ON u.id_unidad = COALESCE(sol.id_unidad_solicitud, s.id_unidad)
JOIN permiso_tipo_solicitud t ON t.id_tipo = sol.id_tipo
WHERE sol.estado = 'REGULARIZAR'
  AND sol.es_urgente = 1;
