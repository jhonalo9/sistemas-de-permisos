SET NAMES utf8mb4;
USE SistemaPermisos;

-- Remuneración usada para calcular descuentos por inasistencias y licencias sin goce.
ALTER TABLE permiso_servidor
  ADD COLUMN remuneracion_mensual DECIMAL(10,2) NULL AFTER estado;

CREATE TABLE permiso_inasistencia (
  id_inasistencia      BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_servidor          INT NOT NULL,
  fecha                DATE NOT NULL,
  tipo                 VARCHAR(20) NOT NULL,
  motivo               VARCHAR(500) NULL,
  fecha_comunicacion   DATE NULL,
  fecha_sustento       DATE NULL,
  estado               VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
  dias_descuento       DECIMAL(6,2) NOT NULL DEFAULT 0,
  id_solicitud         BIGINT NULL,
  observacion          VARCHAR(500) NULL,
  id_usuario_registro  INT NOT NULL,
  creado_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inas_servidor FOREIGN KEY (id_servidor)
    REFERENCES permiso_servidor(id_servidor),
  CONSTRAINT fk_inas_solicitud FOREIGN KEY (id_solicitud)
    REFERENCES permiso_solicitud_papeleta(id_solicitud),
  CONSTRAINT fk_inas_usuario FOREIGN KEY (id_usuario_registro)
    REFERENCES permiso_usuario(id_usuario),
  CONSTRAINT ck_inas_tipo CHECK (tipo IN
    ('ENFERMEDAD','JUSTIFICADA','INJUSTIFICADA','ABANDONO')),
  CONSTRAINT ck_inas_estado CHECK (estado IN
    ('REGISTRADA','JUSTIFICADA','INJUSTIFICADA','CON_DESCUENTO','ANULADA')),
  UNIQUE KEY uq_inas_servidor_fecha (id_servidor, fecha)
) ENGINE=InnoDB;

CREATE INDEX ix_inas_fecha ON permiso_inasistencia(fecha);
CREATE INDEX ix_inas_estado ON permiso_inasistencia(estado);
