SET NAMES utf8mb4;
USE SistemaPermisos;

-- Reglas condicionales configurables por tipo de solicitud.
ALTER TABLE permiso_tipo_solicitud
  ADD COLUMN ajustar_siguiente_habil TINYINT(1) NOT NULL DEFAULT 0
  AFTER dias_calendario;

-- Lugar de comisión dinámico en la papeleta.
ALTER TABLE permiso_solicitud_papeleta
  ADD COLUMN lugar_comision VARCHAR(150) NULL AFTER motivo;

-- Plazo de justificación de inasistencias y abandonos.
ALTER TABLE permiso_inasistencia
  ADD COLUMN fecha_limite_justificacion DATE NULL AFTER fecha_sustento;

CREATE TABLE permiso_tipo_condicion (
  id_condicion    INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo         INT NOT NULL,
  codigo          VARCHAR(40) NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  dias_extra      DECIMAL(6,2) NOT NULL DEFAULT 0,
  dias_calendario TINYINT(1) NOT NULL DEFAULT 1,
  grupo           VARCHAR(30) NULL,
  descripcion     VARCHAR(300) NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cond_tipo_codigo (id_tipo, codigo),
  CONSTRAINT fk_cond_tipo FOREIGN KEY (id_tipo)
    REFERENCES permiso_tipo_solicitud(id_tipo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE permiso_solicitud_condicion (
  id_solicitud BIGINT NOT NULL,
  id_condicion INT NOT NULL,
  dias_extra   DECIMAL(6,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id_solicitud, id_condicion),
  CONSTRAINT fk_solcond_sol FOREIGN KEY (id_solicitud)
    REFERENCES permiso_solicitud_papeleta(id_solicitud) ON DELETE CASCADE,
  CONSTRAINT fk_solcond_cond FOREIGN KEY (id_condicion)
    REFERENCES permiso_tipo_condicion(id_condicion) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO permiso_configuracion (clave, valor, descripcion) VALUES
  ('lugar_expedicion', 'Chiclayo',
   'Lugar de expedición que se imprime en la papeleta'),
  ('dias_justificacion_abandono', '1',
   'Días hábiles para justificar un abandono de centro de labores'),
  ('dias_justificacion_enfermedad', '3',
   'Días hábiles para presentar el sustento de enfermedad (CITT)')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- Fallecimiento: 5 días hábiles + 3 días calendario si ocurre en otra ciudad.
INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'FALLECE_OTRA_CIUDAD',
       'El fallecimiento ocurrió en otra ciudad', 3, 1, 'FALLECIMIENTO',
       'Agrega 3 días calendario al plazo por desplazamiento.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_FALLECIMIENTO'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Paternidad: 10 días base; 20 con complicaciones; 30 por nacimiento múltiple.
INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'PARTO_COMPLICACIONES',
       'Nacimiento prematuro o con complicaciones', 10, 1, 'PATERNIDAD',
       'Extiende la licencia a 20 días calendario.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_PATERNIDAD'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'PARTO_MULTIPLE',
       'Nacimiento múltiple', 20, 1, 'PATERNIDAD',
       'Extiende la licencia a 30 días calendario.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_PATERNIDAD'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Maternidad: 98 días base + 30 por nacimiento múltiple.
INSERT INTO permiso_tipo_condicion
  (id_tipo, codigo, nombre, dias_extra, dias_calendario, grupo, descripcion)
SELECT id_tipo, 'PARTO_MULTIPLE',
       'Nacimiento múltiple', 30, 1, 'MATERNIDAD',
       'Agrega 30 días calendario al descanso por nacimiento múltiple.'
FROM permiso_tipo_solicitud WHERE codigo = 'LIC_MATERNIDAD'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Onomástico: si cae en día no laborable se traslada al siguiente día hábil.
UPDATE permiso_tipo_solicitud
SET ajustar_siguiente_habil = 1
WHERE codigo = 'LIC_ONOMASTICO';
