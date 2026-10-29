SET NAMES utf8mb4;
USE SistemaPermisos;

-- Inicializa asignaciones en 0 usando el máximo anual del tipo.
UPDATE permiso_saldo_servidor sa
JOIN permiso_tipo_solicitud t ON t.id_tipo = sa.id_tipo
SET sa.asignado = t.max_por_anio
WHERE sa.asignado = 0
  AND t.max_por_anio IS NOT NULL;

-- Recalcula el usado real a partir de solicitudes vigentes.
UPDATE permiso_saldo_servidor sa
SET sa.usado = COALESCE((
  SELECT SUM(s.cantidad)
  FROM permiso_solicitud_papeleta s
  WHERE s.id_servidor = sa.id_servidor
    AND s.id_tipo = sa.id_tipo
    AND YEAR(s.fecha_inicio) = sa.anio
    AND s.estado IN ('APROBADA_RRHH', 'EN_CURSO', 'EJECUTADA')
), 0);
