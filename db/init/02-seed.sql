SET NAMES utf8mb4;
USE SistemaPermisos;

INSERT INTO permiso_rol (nombre) VALUES
  ('SERVIDOR'),('JEFE'),('RRHH'),('CONTROL'),('ADMIN'),('GERENCIA');

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
   max_por_anio, max_solicitudes_mes, dias_anticipacion, anticipacion_dias_habiles,
   permite_mismo_dia, max_horas_semana, max_horas_dia, requiere_entrega_cargo,
   autoridad_aprobacion, tipo_sustento, requiere_sustento, permite_regularizar,
   dias_calendario, base_legal, plazo_regularizacion_dias)
VALUES
  ('PER_EMERGENCIA', 'Salida de emergencia (por regularizar)',
   'PERMISO', 1, 'HORAS', NULL, NULL, NULL, 0, 1, 1, NULL, NULL, 0,
   'RRHH', 'Evidencia de la emergencia', 1, 1, 1,
   'RISC de la entidad [VERIFICAR]', 5),
  ('LIC_FALLECIMIENTO', 'Licencia por fallecimiento de familiar',
   'LICENCIA', 1, 'DIAS', 5, NULL, NULL, 0, 1, 1, NULL, NULL, 0,
   'RRHH', 'Certificado de defunción', 1, 0, 0,
   'D.Leg. 276, art. 116; RISC art. 30', NULL),
  ('PER_PERSONAL', 'Permiso personal por horas',
   'PERMISO', 0, 'HORAS', 4, 40, 4, 1, 1, 1, NULL, 4, 0,
   'RRHH', 'Justificación del motivo', 1, 0, 1,
   'RISC arts. 28 y 41', NULL),
  ('LIC_SIN_GOCE', 'Licencia sin goce de remuneraciones',
   'LICENCIA', 0, 'DIAS', 90, 90, NULL, 3, 0, 0, NULL, NULL, 1,
   'GERENCIA', 'Solicitud escrita y documento de sustento', 1, 0, 1,
   'RISC arts. 31 y 41', NULL),
  ('PER_ENFERMEDAD', 'Permiso por enfermedad o accidente',
   'PERMISO', 1, 'HORAS', NULL, NULL, 4, 0, 1, 1, NULL, 8, 0,
   'RRHH', 'Constancia médica o receta médica', 1, 0, 1,
   'RISC art. 28, literal a', NULL),
  ('PER_ATENCION_MEDICA', 'Permiso por atención médica',
   'PERMISO', 1, 'HORAS', NULL, NULL, 4, 0, 1, 1, NULL, 8, 0,
   'RRHH', 'Constancia médica', 1, 0, 1,
   'RISC art. 28, literal b', NULL),
  ('PER_FUNCION_EDIL', 'Permiso por función edil o regional',
   'PERMISO', 1, 'DIAS', NULL, NULL, NULL, 1, 1, 1, NULL, NULL, 0,
   'RRHH', 'Credencial o documento de elección', 1, 0, 1,
   'RISC art. 28, literal c y art. 40', NULL),
  ('PER_COMISION_SERVICIO', 'Permiso por comisión de servicio',
   'PERMISO', 1, 'DIAS', NULL, NULL, NULL, 1, 1, 0, NULL, NULL, 0,
   'RRHH', 'Documento de comisión y autorización', 1, 0, 1,
   'RISC arts. 28 y 48', NULL),
  ('PER_CAPACITACION', 'Permiso por capacitación',
   'PERMISO', 1, 'DIAS', NULL, NULL, NULL, 1, 1, 0, NULL, NULL, 0,
   'RRHH', 'Invitación o programa de capacitación', 1, 0, 1,
   'RISC art. 28, literal e', NULL),
  ('PER_LACTANCIA', 'Permiso por lactancia materna',
   'PERMISO', 1, 'HORAS', 1, NULL, NULL, 0, 1, 1, 5, 1, 0,
   'RRHH', 'Partida de nacimiento o DNI del menor', 1, 0, 1,
   'Ley N.° 27240; RISC art. 35', NULL),
  ('PER_CITACION', 'Permiso por citación judicial, militar o policial',
   'PERMISO', 1, 'DIAS', NULL, NULL, NULL, 0, 1, 1, NULL, NULL, 0,
   'RRHH', 'Documento oficial de citación', 1, 0, 1,
   'RISC art. 28, literal g y art. 39', NULL),
  ('PER_DOCENCIA', 'Permiso por docencia universitaria',
   'PERMISO', 1, 'HORAS', 6, NULL, NULL, 0, 1, 1, 6, NULL, 0,
   'RRHH', 'Constancia de docencia', 1, 0, 1,
   'RISC art. 28, literal h', NULL),
  ('LIC_ENFERMEDAD', 'Licencia por enfermedad o accidente',
   'LICENCIA', 1, 'DIAS', 340, 340, NULL, 0, 1, 1, NULL, NULL, 1,
   'GERENCIA', 'Certificado de Incapacidad Temporal para el Trabajo (CITT)', 1, 0, 1,
   'RISC arts. 30 y 33', NULL),
  ('LIC_MATERNIDAD', 'Licencia por descanso pre y post natal',
   'LICENCIA', 1, 'DIAS', 98, NULL, NULL, 0, 1, 0, NULL, NULL, 1,
   'GERENCIA', 'Informe médico y partida de nacimiento', 1, 0, 1,
   'RISC arts. 30 y 34', NULL),
  ('LIC_FORMACION', 'Licencia para formación laboral',
   'LICENCIA', 1, 'DIAS', NULL, NULL, NULL, 1, 1, 0, NULL, NULL, 1,
   'RRHH', 'Documento de matrícula o programa', 1, 0, 1,
   'RISC arts. 30 y 38', NULL),
  ('LIC_PATERNIDAD', 'Licencia por paternidad',
   'LICENCIA', 1, 'DIAS', 30, NULL, NULL, 0, 1, 0, NULL, NULL, 1,
   'GERENCIA', 'Partida de nacimiento y certificado médico', 1, 0, 1,
   'Ley N.° 29409 y Ley N.° 30807; RISC art. 36', NULL),
  ('LIC_ONOMASTICO', 'Licencia por onomástico',
   'LICENCIA', 1, 'DIAS', 1, 1, NULL, 0, 1, 1, NULL, NULL, 0,
   'RRHH', 'No requiere documento adicional', 0, 0, 1,
   'RISC art. 37', NULL),
  ('LIC_CITACION', 'Licencia por citación expresa judicial, militar o policial',
   'LICENCIA', 1, 'DIAS', NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 1,
   'RRHH', 'Documento oficial de citación', 1, 0, 1,
   'RISC arts. 30 y 39', NULL),
  ('LIC_ENFERMEDAD_GRAVE_FAMILIAR', 'Licencia por enfermedad grave de familiar',
   'LICENCIA', 1, 'DIAS', 7, NULL, NULL, 0, 1, 1, NULL, NULL, 0,
   'RRHH', 'Certificado médico', 1, 0, 1,
   'RISC arts. 30 y 42', NULL),
  ('LIC_MATRIMONIO', 'Licencia por matrimonio',
   'LICENCIA', 1, 'DIAS', 30, NULL, NULL, 1, 1, 0, NULL, NULL, 1,
   'GERENCIA', 'Partida de matrimonio', 1, 0, 1,
   'RISC arts. 30 y 42', NULL);

UPDATE permiso_tipo_solicitud SET ajustar_siguiente_habil = 1 WHERE codigo = 'LIC_ONOMASTICO';

INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'FALLECE_OTRA_CIUDAD',
       'El fallecimiento ocurrió en otra ciudad', 3, 1, 'FALLECIMIENTO',
       'Agrega 3 días calendario al plazo por desplazamiento.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_FALLECIMIENTO';

INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'PARTO_COMPLICACIONES',
       'Nacimiento prematuro o con complicaciones', 10, 1, 'PATERNIDAD',
       'Extiende la licencia a 20 días calendario.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_PATERNIDAD';

INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'PARTO_MULTIPLE',
       'Nacimiento múltiple', 20, 1, 'PATERNIDAD',
       'Extiende la licencia a 30 días calendario.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_PATERNIDAD';

INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'PARTO_MULTIPLE',
       'Nacimiento múltiple', 30, 1, 'MATERNIDAD',
       'Agrega 30 días calendario al descanso por nacimiento múltiple.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_MATERNIDAD';

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
  ('hora_corte_jornada', '17:00', 'Hora oficial de fin de jornada para alertas de no retorno'),
  ('lugar_expedicion', 'Chiclayo', 'Lugar de expedición que se imprime en la papeleta'),
  ('dias_justificacion_abandono', '1', 'Días hábiles para justificar un abandono de centro de labores'),
  ('dias_justificacion_enfermedad', '3', 'Días hábiles para presentar el sustento de enfermedad (CITT)');

-- Usuario admin inicial (contraseña: Admin2026!)
-- Hash bcrypt válido para 'Admin2026!' generado con password_hash('Admin2026!', PASSWORD_BCRYPT)
INSERT INTO permiso_usuario (username, password_hash, nombre, activo)
VALUES ('admin',
        '$2y$12$jZl7L7AvC6Xmwm/DoClNJOeYsDUI7ua6LA4XhKfK5apSxonbL8jva',
        'Administrador del sistema', 1);

SET @id_admin = LAST_INSERT_ID();
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_admin, id_rol FROM permiso_rol WHERE nombre = 'ADMIN';