SET NAMES utf8mb4;
USE SistemaPermisos;

-- Aprobación final por jefe inmediato para permisos por horas.
-- La duración real se registra en Control de Personal.
ALTER TABLE permiso_solicitud_papeleta
  ADD COLUMN con_retorno TINYINT(1) NULL AFTER cantidad;

ALTER TABLE permiso_solicitud_papeleta DROP CHECK ck_sol_estado;

ALTER TABLE permiso_solicitud_papeleta
  ADD CONSTRAINT ck_sol_estado CHECK (estado IN
    ('BORRADOR','REGULARIZAR','PENDIENTE','OBSERVADA','APROBADA_JEFE',
     'APROBADA','APROBADA_RRHH','PENDIENTE_GERENCIA','EN_CURSO',
     'RECHAZADA','ANULADA','EJECUTADA'));

-- Cierre manual de un permiso sin retorno.
ALTER TABLE permiso_marcacion_control DROP CHECK ck_marc_tipo;

ALTER TABLE permiso_marcacion_control
  ADD CONSTRAINT ck_marc_tipo CHECK (tipo IN ('SALIDA','RETORNO','CIERRE'));

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
  sol.con_retorno,
  sol.estado,
  sol.es_urgente,
  t.codigo AS tipo_codigo,
  t.nombre AS tipo_nombre,
  t.unidad_medida,
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
  AND sol.estado IN ('APROBADA', 'APROBADA_RRHH', 'EN_CURSO', 'REGULARIZAR')
  AND s.estado = 'ACTIVO';
