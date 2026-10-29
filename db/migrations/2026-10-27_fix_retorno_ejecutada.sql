SET NAMES utf8mb4;
USE SistemaPermisos;

-- Corrige solicitudes que ya tienen SALIDA y RETORNO pero quedaron EN_CURSO.
UPDATE permiso_solicitud_papeleta s
SET s.estado = 'EJECUTADA'
WHERE s.estado = 'EN_CURSO'
  AND EXISTS (
    SELECT 1 FROM permiso_marcacion_control m
    WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'SALIDA'
  )
  AND EXISTS (
    SELECT 1 FROM permiso_marcacion_control m
    WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'RETORNO'
  );

-- Agrega el historial de retorno cuando no exista ya un cierre EJECUTADA.
INSERT INTO permiso_solicitud_historial
  (id_solicitud, estado_ant, estado_new, id_usuario, comentario)
SELECT s.id_solicitud, 'EN_CURSO', 'EJECUTADA',
       COALESCE((
         SELECT m.id_usuario_control
         FROM permiso_marcacion_control m
         WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'RETORNO'
         LIMIT 1
       ), 1),
       'Retorno registrado en Control de Personal.'
FROM permiso_solicitud_papeleta s
WHERE s.estado = 'EJECUTADA'
  AND EXISTS (
    SELECT 1 FROM permiso_marcacion_control m
    WHERE m.id_solicitud = s.id_solicitud AND m.tipo = 'RETORNO'
  )
  AND NOT EXISTS (
    SELECT 1 FROM permiso_solicitud_historial h
    WHERE h.id_solicitud = s.id_solicitud AND h.estado_new = 'EJECUTADA'
  );
