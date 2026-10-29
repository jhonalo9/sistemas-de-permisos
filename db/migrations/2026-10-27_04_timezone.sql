-- ============================================================
-- Conversión de timestamps existentes de UTC a America/Lima.
-- Ejecutar UNA SOLA VEZ sobre una base que fue creada con TZ=UTC.
-- Hacer backup antes de ejecutar.
-- Para instalaciones nuevas no es necesario: el contenedor ya usa TZ=America/Lima.
-- ============================================================

SET NAMES utf8mb4;
USE SistemaPermisos;

UPDATE permiso_marcacion_control
SET fecha_hora = DATE_SUB(fecha_hora, INTERVAL 5 HOUR);

UPDATE permiso_solicitud_adjunto
SET subido_en = DATE_SUB(subido_en, INTERVAL 5 HOUR);

UPDATE permiso_solicitud_historial
SET creado_en = DATE_SUB(creado_en, INTERVAL 5 HOUR);

UPDATE permiso_solicitud_papeleta
SET fecha_visa = DATE_SUB(fecha_visa, INTERVAL 5 HOUR)
WHERE fecha_visa IS NOT NULL;

UPDATE permiso_solicitud_papeleta
SET creado_en = DATE_SUB(creado_en, INTERVAL 5 HOUR),
    actualizado_en = DATE_SUB(actualizado_en, INTERVAL 5 HOUR);
