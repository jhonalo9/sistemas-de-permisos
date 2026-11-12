SET NAMES utf8mb4;
USE SistemaPermisos;

-- Reglas configurables por tipo de permiso o licencia.
ALTER TABLE permiso_tipo_solicitud
  ADD COLUMN max_solicitudes_mes SMALLINT NULL AFTER max_por_anio,
  ADD COLUMN dias_anticipacion SMALLINT NOT NULL DEFAULT 0 AFTER max_solicitudes_mes,
  ADD COLUMN anticipacion_dias_habiles TINYINT(1) NOT NULL DEFAULT 1 AFTER dias_anticipacion,
  ADD COLUMN permite_mismo_dia TINYINT(1) NOT NULL DEFAULT 1 AFTER anticipacion_dias_habiles,
  ADD COLUMN max_horas_semana DECIMAL(6,2) NULL AFTER permite_mismo_dia,
  ADD COLUMN max_horas_dia DECIMAL(6,2) NULL AFTER max_horas_semana,
  ADD COLUMN requiere_entrega_cargo TINYINT(1) NOT NULL DEFAULT 0 AFTER max_horas_dia,
  ADD COLUMN autoridad_aprobacion VARCHAR(20) NOT NULL DEFAULT 'RRHH' AFTER requiere_entrega_cargo,
  ADD COLUMN tipo_sustento VARCHAR(255) NULL AFTER autoridad_aprobacion;

-- Declaración de entrega de cargo para licencias de 20 días o más.
ALTER TABLE permiso_solicitud_papeleta
  ADD COLUMN entrega_cargo TINYINT(1) NOT NULL DEFAULT 0 AFTER cantidad;

-- Ajustes a los tipos existentes.
UPDATE permiso_tipo_solicitud SET
  dias_calendario = 0,
  max_por_solicitud = 5,
  max_por_anio = NULL,
  dias_anticipacion = 0,
  anticipacion_dias_habiles = 1,
  permite_mismo_dia = 1,
  autoridad_aprobacion = 'RRHH',
  tipo_sustento = 'Certificado de defunción',
  base_legal = 'D.Leg. 276, art. 116; RISC art. 30'
WHERE codigo = 'LIC_FALLECIMIENTO';

UPDATE permiso_tipo_solicitud SET
  con_goce = 0,
  max_por_solicitud = 4,
  max_por_anio = 40,
  max_solicitudes_mes = 4,
  dias_anticipacion = 1,
  anticipacion_dias_habiles = 1,
  permite_mismo_dia = 1,
  max_horas_dia = 4,
  autoridad_aprobacion = 'RRHH',
  tipo_sustento = 'Justificación del motivo',
  base_legal = 'RISC arts. 28 y 41'
WHERE codigo = 'PER_PERSONAL';

UPDATE permiso_tipo_solicitud SET
  max_por_solicitud = 90,
  max_por_anio = 90,
  max_solicitudes_mes = NULL,
  dias_anticipacion = 3,
  anticipacion_dias_habiles = 0,
  permite_mismo_dia = 0,
  requiere_entrega_cargo = 1,
  autoridad_aprobacion = 'GERENCIA',
  tipo_sustento = 'Solicitud escrita y documento de sustento',
  base_legal = 'RISC arts. 31 y 41'
WHERE codigo = 'LIC_SIN_GOCE';

-- Catálogo legal completo. No se modifican los códigos ya existentes.
INSERT IGNORE INTO permiso_tipo_solicitud
  (codigo, nombre, categoria, con_goce, unidad_medida, max_por_solicitud,
   max_por_anio, max_solicitudes_mes, dias_anticipacion, anticipacion_dias_habiles,
   permite_mismo_dia, max_horas_semana, max_horas_dia, requiere_entrega_cargo,
   autoridad_aprobacion, tipo_sustento, requiere_sustento, permite_regularizar,
   dias_calendario, base_legal, plazo_regularizacion_dias, activo)
VALUES
  ('PER_ENFERMEDAD', 'Permiso por enfermedad o accidente', 'PERMISO', 1, 'HORAS',
   NULL, NULL, 4, 0, 1, 1, NULL, 8, 0, 'RRHH',
   'Constancia médica o receta médica', 1, 0, 1,
   'RISC art. 28, literal a', NULL, 1),
  ('PER_ATENCION_MEDICA', 'Permiso por atención médica', 'PERMISO', 1, 'HORAS',
   NULL, NULL, 4, 0, 1, 1, NULL, 8, 0, 'RRHH',
   'Constancia médica', 1, 0, 1,
   'RISC art. 28, literal b', NULL, 1),
  ('PER_FUNCION_EDIL', 'Permiso por función edil o regional', 'PERMISO', 1, 'DIAS',
   NULL, NULL, NULL, 1, 1, 1, NULL, NULL, 0, 'RRHH',
   'Credencial o documento de elección', 1, 0, 1,
   'RISC art. 28, literal c y art. 40', NULL, 1),
  ('PER_COMISION_SERVICIO', 'Permiso por comisión de servicio', 'PERMISO', 1, 'DIAS',
   NULL, NULL, NULL, 1, 1, 0, NULL, NULL, 0, 'RRHH',
   'Documento de comisión y autorización', 1, 0, 1,
   'RISC arts. 28 y 48', NULL, 1),
  ('PER_CAPACITACION', 'Permiso por capacitación', 'PERMISO', 1, 'DIAS',
   NULL, NULL, NULL, 1, 1, 0, NULL, NULL, 0, 'RRHH',
   'Invitación o programa de capacitación', 1, 0, 1,
   'RISC art. 28, literal e', NULL, 1),
  ('PER_LACTANCIA', 'Permiso por lactancia materna', 'PERMISO', 1, 'HORAS',
   1, NULL, NULL, 0, 1, 1, 5, 1, 0, 'RRHH',
   'Partida de nacimiento o DNI del menor', 1, 0, 1,
   'Ley N.° 27240; RISC art. 35', NULL, 1),
  ('PER_CITACION', 'Permiso por citación judicial, militar o policial', 'PERMISO', 1, 'DIAS',
   NULL, NULL, NULL, 0, 1, 1, NULL, NULL, 0, 'RRHH',
   'Documento oficial de citación', 1, 0, 1,
   'RISC art. 28, literal g y art. 39', NULL, 1),
  ('PER_DOCENCIA', 'Permiso por docencia universitaria', 'PERMISO', 1, 'HORAS',
   6, NULL, NULL, 0, 1, 1, 6, NULL, 0, 'RRHH',
   'Constancia de docencia', 1, 0, 1,
   'RISC art. 28, literal h', NULL, 1),
  ('LIC_ENFERMEDAD', 'Licencia por enfermedad o accidente', 'LICENCIA', 1, 'DIAS',
   340, 340, NULL, 0, 1, 1, NULL, NULL, 1, 'GERENCIA',
   'Certificado de Incapacidad Temporal para el Trabajo (CITT)', 1, 0, 1,
   'RISC arts. 30 y 33', NULL, 1),
  ('LIC_MATERNIDAD', 'Licencia por descanso pre y post natal', 'LICENCIA', 1, 'DIAS',
   98, NULL, NULL, 0, 1, 0, NULL, NULL, 1, 'GERENCIA',
   'Informe médico y partida de nacimiento', 1, 0, 1,
   'RISC arts. 30 y 34', NULL, 1),
  ('LIC_FORMACION', 'Licencia para formación laboral', 'LICENCIA', 1, 'DIAS',
   NULL, NULL, NULL, 1, 1, 0, NULL, NULL, 1, 'RRHH',
   'Documento de matrícula o programa', 1, 0, 1,
   'RISC arts. 30 y 38', NULL, 1),
  ('LIC_PATERNIDAD', 'Licencia por paternidad', 'LICENCIA', 1, 'DIAS',
   30, NULL, NULL, 0, 1, 0, NULL, NULL, 1, 'GERENCIA',
   'Partida de nacimiento y certificado médico', 1, 0, 1,
   'Ley N.° 29409 y Ley N.° 30807; RISC art. 36', NULL, 1),
  ('LIC_ONOMASTICO', 'Licencia por onomástico', 'LICENCIA', 1, 'DIAS',
   1, 1, NULL, 0, 1, 1, NULL, NULL, 0, 'RRHH',
   'No requiere documento adicional', 0, 0, 1,
   'RISC art. 37', NULL, 1),
  ('LIC_CITACION', 'Licencia por citación expresa judicial, militar o policial', 'LICENCIA', 1, 'DIAS',
   NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 1, 'RRHH',
   'Documento oficial de citación', 1, 0, 1,
   'RISC arts. 30 y 39', NULL, 1),
  ('LIC_ENFERMEDAD_GRAVE_FAMILIAR', 'Licencia por enfermedad grave de familiar', 'LICENCIA', 1, 'DIAS',
   7, NULL, NULL, 0, 1, 1, NULL, NULL, 0, 'RRHH',
   'Certificado médico', 1, 0, 1,
   'RISC arts. 30 y 42', NULL, 1),
  ('LIC_MATRIMONIO', 'Licencia por matrimonio', 'LICENCIA', 1, 'DIAS',
   30, NULL, NULL, 1, 1, 0, NULL, NULL, 1, 'GERENCIA',
   'Partida de matrimonio', 1, 0, 1,
   'RISC arts. 30 y 42', NULL, 1);
