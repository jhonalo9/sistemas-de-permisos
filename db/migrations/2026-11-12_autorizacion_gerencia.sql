SET NAMES utf8mb4;
USE SistemaPermisos;

INSERT IGNORE INTO permiso_rol (nombre) VALUES ('GERENCIA');

ALTER TABLE permiso_solicitud_papeleta DROP CHECK ck_sol_estado;

ALTER TABLE permiso_solicitud_papeleta
  ADD CONSTRAINT ck_sol_estado CHECK (estado IN
    ('BORRADOR','REGULARIZAR','PENDIENTE','OBSERVADA','APROBADA_JEFE',
     'APROBADA_RRHH','PENDIENTE_GERENCIA','EN_CURSO','RECHAZADA','ANULADA','EJECUTADA'));
