SET NAMES utf8mb4;
USE SistemaPermisos;

INSERT INTO permiso_rol (nombre) VALUES
  ('SERVIDOR'),('JEFE'),('RRHH'),('CONTROL'),('ADMIN');

INSERT INTO permiso_unidad_organica (nombre) VALUES
  ('Alcaldía'),('Gerencia General'),('Oficina de Gestión de Recursos Humanos'),
  ('Control de Personal'),('Subgerencia de Tesorería');

INSERT INTO permiso_cargo (nombre) VALUES
  ('Jefe de Oficina de RRHH'),
  ('Especialista RRHH'),
  ('Analista RRHH'),
  ('Control de Personal'),
  ('Asistente de Tesorería');

INSERT INTO permiso_tipo_solicitud
  (codigo, nombre, categoria, con_goce, unidad_medida, max_por_solicitud,
   max_por_anio, requiere_sustento, permite_regularizar, dias_calendario,
   base_legal, plazo_regularizacion_dias)
VALUES
  ('PER_EMERGENCIA', 'Salida de emergencia (por regularizar)',
   'PERMISO', 1, 'HORAS', NULL, NULL, 1, 1, 1,
   'RISC de la entidad [VERIFICAR]', 5),
  ('LIC_FALLECIMIENTO', 'Licencia por fallecimiento de familiar',
   'LICENCIA', 1, 'DIAS', 5, 5, 1, 0, 1,
   'D.Leg. 276, art. 116 [VERIFICAR]', NULL),
  ('PER_PERSONAL', 'Permiso personal por horas',
   'PERMISO', 1, 'HORAS', 4, 40, 1, 0, 1,
   'RISC de la entidad [VERIFICAR]', NULL),
  ('LIC_SIN_GOCE', 'Licencia sin goce de remuneraciones',
   'LICENCIA', 0, 'DIAS', 30, 90, 1, 0, 1,
   'D.Leg. 276, art. 119 [VERIFICAR]', NULL);

INSERT INTO permiso_feriado (fecha, descripcion) VALUES
  ('2026-01-01', 'Año Nuevo'),
  ('2026-04-02', 'Jueves Santo'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-05-01', 'Día del Trabajo'),
  ('2026-06-07', 'Batalla de Arica y Día de la Bandera'),
  ('2026-06-29', 'San Pedro y San Pablo'),
  ('2026-07-23', 'Día de la Fuerza Aérea del Perú'),
  ('2026-07-28', 'Fiestas Patrias'),
  ('2026-07-29', 'Fiestas Patrias'),
  ('2026-08-06', 'Batalla de Junín'),
  ('2026-08-30', 'Santa Rosa de Lima'),
  ('2026-10-08', 'Combate de Angamos'),
  ('2026-11-01', 'Todos los Santos'),
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-09', 'Batalla de Ayacucho'),
  ('2026-12-25', 'Navidad');

INSERT INTO permiso_puesto_control (nombre, ubicacion) VALUES
  ('Control de Personal - Sede Central', 'Ingreso principal');

INSERT INTO permiso_configuracion (clave, valor, descripcion) VALUES
  ('hora_corte_jornada', '17:00', 'Hora oficial de fin de jornada para alertas de no retorno');

-- Usuario admin inicial (contraseña: Admin2026!)
-- Hash bcrypt válido para 'Admin2026!' generado con password_hash('Admin2026!', PASSWORD_BCRYPT)
INSERT INTO permiso_usuario (username, password_hash, nombre, activo)
VALUES ('admin',
        '$2y$12$jZl7L7AvC6Xmwm/DoClNJOeYsDUI7ua6LA4XhKfK5apSxonbL8jva',
        'Administrador del sistema', 1);

SET @id_admin = LAST_INSERT_ID();
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_admin, id_rol FROM permiso_rol WHERE nombre = 'ADMIN';