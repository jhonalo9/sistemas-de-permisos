SET NAMES utf8mb4;
USE SistemaPermisos;

-- Anula solicitudes creadas por la vía normal usando el tipo temporal PER_EMERGENCIA.
INSERT INTO permiso_solicitud_historial
  (id_solicitud, estado_ant, estado_new, id_usuario, comentario)
SELECT s.id_solicitud, s.estado, 'ANULADA', 1,
       'Anulada: la salida de emergencia debe registrarse desde Control de Personal.'
FROM permiso_solicitud_papeleta s
JOIN permiso_tipo_solicitud t ON t.id_tipo = s.id_tipo
WHERE t.codigo = 'PER_EMERGENCIA'
  AND s.es_urgente = 0
  AND s.estado NOT IN ('ANULADA', 'EJECUTADA', 'RECHAZADA');

UPDATE permiso_solicitud_papeleta s
JOIN permiso_tipo_solicitud t ON t.id_tipo = s.id_tipo
SET s.estado = 'ANULADA'
WHERE t.codigo = 'PER_EMERGENCIA'
  AND s.es_urgente = 0
  AND s.estado NOT IN ('ANULADA', 'EJECUTADA', 'RECHAZADA');

-- El tipo de emergencia no tiene saldo propio: el descuento es del tipo definitivo.
DELETE sa
FROM permiso_saldo_servidor sa
JOIN permiso_tipo_solicitud t ON t.id_tipo = sa.id_tipo
WHERE t.codigo = 'PER_EMERGENCIA';
