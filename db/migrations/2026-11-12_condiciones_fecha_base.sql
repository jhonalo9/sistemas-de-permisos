SET NAMES utf8mb4;
USE SistemaPermisos;

-- Fecha fin original antes de aplicar los días extra de las reglas condicionales.
ALTER TABLE permiso_solicitud_papeleta
  ADD COLUMN fecha_fin_base DATE NULL AFTER fecha_fin;
