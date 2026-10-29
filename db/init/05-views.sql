SET NAMES utf8mb4;
USE SistemaPermisos;

-- ============================================================
-- Vistas de apoyo para bandejas, reportes y control
-- ============================================================

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

CREATE OR REPLACE VIEW vw_personal_fuera AS
SELECT
  s.id_servidor,
  s.dni,
  CONCAT(s.apellidos, ', ', s.nombres) AS nombre_completo,
  CONCAT(s.apellidos, ', ', s.nombres) AS servidor,
  c.nombre AS cargo,
  COALESCE(sol.id_unidad_solicitud, s.id_unidad) AS id_unidad,
  u.nombre AS unidad,
  sol.id_solicitud,
  sol.nro_solicitud,
  sol.id_jefe_solicitud,
  sol.fecha_inicio,
  sol.fecha_fin,
  sol.hora_inicio,
  sol.hora_fin,
  sol.estado,
  sol.es_urgente,
  t.codigo AS tipo_codigo,
  t.nombre AS tipo_nombre,
  m_sal.fecha_hora AS hora_salida,
  m_ret.fecha_hora AS hora_retorno,
  TIMESTAMPDIFF(MINUTE, m_sal.fecha_hora, NOW()) AS minutos_fuera
FROM permiso_marcacion_control m_sal
JOIN permiso_solicitud_papeleta sol ON sol.id_solicitud = m_sal.id_solicitud
JOIN permiso_servidor s ON s.id_servidor = sol.id_servidor
LEFT JOIN permiso_cargo c ON c.id_cargo = COALESCE(sol.id_cargo_solicitud, s.id_cargo)
JOIN permiso_unidad_organica u ON u.id_unidad = COALESCE(sol.id_unidad_solicitud, s.id_unidad)
JOIN permiso_tipo_solicitud t ON t.id_tipo = sol.id_tipo
LEFT JOIN permiso_marcacion_control m_ret
  ON m_ret.id_solicitud = sol.id_solicitud
 AND m_ret.tipo = 'RETORNO'
WHERE m_sal.tipo = 'SALIDA'
  AND m_ret.id_marcacion IS NULL
  AND sol.estado IN ('APROBADA_RRHH', 'EN_CURSO', 'REGULARIZAR', 'EJECUTADA')
  AND s.estado = 'ACTIVO';
