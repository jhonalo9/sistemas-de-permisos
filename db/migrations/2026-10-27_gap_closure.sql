SET NAMES utf8mb4;
USE SistemaPermisos;

-- ============================================================
-- Cierre de brechas: cargos, snapshots de ruta, configuración,
-- borradores incompletos y relación 1:1 usuario-servidor.
-- ============================================================

-- 1. Catálogo de cargos
CREATE TABLE IF NOT EXISTS permiso_cargo (
  id_cargo INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(120) NOT NULL UNIQUE,
  activo   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

INSERT IGNORE INTO permiso_cargo (nombre) VALUES
  ('Jefe de Oficina de RRHH'),
  ('Especialista RRHH'),
  ('Analista RRHH'),
  ('Control de Personal'),
  ('Asistente de Tesorería');

-- 2. Cargos en servidores
ALTER TABLE permiso_servidor
  ADD COLUMN id_cargo INT NULL AFTER id_unidad;

UPDATE permiso_servidor s
JOIN permiso_cargo c ON c.nombre = TRIM(s.cargo)
SET s.id_cargo = c.id_cargo;

INSERT IGNORE INTO permiso_cargo (nombre)
SELECT DISTINCT TRIM(s.cargo)
FROM permiso_servidor s
LEFT JOIN permiso_cargo c ON c.nombre = TRIM(s.cargo)
WHERE s.cargo IS NOT NULL
  AND TRIM(s.cargo) <> ''
  AND c.id_cargo IS NULL;

UPDATE permiso_servidor s
JOIN permiso_cargo c ON c.nombre = TRIM(s.cargo)
SET s.id_cargo = c.id_cargo
WHERE s.id_cargo IS NULL;

ALTER TABLE permiso_servidor
  ADD CONSTRAINT fk_serv_cargo FOREIGN KEY (id_cargo)
    REFERENCES permiso_cargo(id_cargo);

-- 3. Configuración del sistema
CREATE TABLE IF NOT EXISTS permiso_configuracion (
  clave         VARCHAR(60) PRIMARY KEY,
  valor         VARCHAR(255) NOT NULL,
  descripcion   VARCHAR(255) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO permiso_configuracion (clave, valor, descripcion) VALUES
  ('hora_corte_jornada', '17:00', 'Hora oficial de fin de jornada para alertas de no retorno')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- 4. Snapshots de jefe, unidad y cargo en la solicitud
ALTER TABLE permiso_solicitud_papeleta
  MODIFY fecha_inicio DATE NULL,
  MODIFY fecha_fin DATE NULL,
  ADD COLUMN id_jefe_solicitud INT NULL AFTER id_tipo,
  ADD COLUMN id_unidad_solicitud INT NULL AFTER id_jefe_solicitud,
  ADD COLUMN id_cargo_solicitud INT NULL AFTER id_unidad_solicitud;

UPDATE permiso_solicitud_papeleta sol
JOIN permiso_servidor s ON s.id_servidor = sol.id_servidor
SET sol.id_jefe_solicitud   = s.id_jefe,
    sol.id_unidad_solicitud = s.id_unidad,
    sol.id_cargo_solicitud  = s.id_cargo;

ALTER TABLE permiso_solicitud_papeleta
  ADD CONSTRAINT fk_sol_jefe_solicitud FOREIGN KEY (id_jefe_solicitud)
    REFERENCES permiso_servidor(id_servidor),
  ADD CONSTRAINT fk_sol_unidad_solicitud FOREIGN KEY (id_unidad_solicitud)
    REFERENCES permiso_unidad_organica(id_unidad),
  ADD CONSTRAINT fk_sol_cargo_solicitud FOREIGN KEY (id_cargo_solicitud)
    REFERENCES permiso_cargo(id_cargo);

-- 5. Relación 1:1 usuario-servidor (los NULL siguen permitidos)
ALTER TABLE permiso_usuario
  ADD UNIQUE KEY uq_usuario_servidor (id_servidor);

-- 6. Recrear vistas usando snapshots y catálogo de cargos
DROP VIEW IF EXISTS vw_regularizaciones_pendientes;
DROP VIEW IF EXISTS vw_personal_fuera;

CREATE VIEW vw_regularizaciones_pendientes AS
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

CREATE VIEW vw_personal_fuera AS
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

-- 7. Eliminar la columna de texto cargo (ya migrada a id_cargo)
ALTER TABLE permiso_servidor DROP COLUMN cargo;
