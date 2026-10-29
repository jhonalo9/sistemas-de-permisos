SET NAMES utf8mb4;
USE SistemaPermisos;

CREATE TABLE permiso_rol (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE
) ENGINE=InnoDB;


CREATE TABLE permiso_unidad_organica (
  id_unidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(150) NOT NULL,
  id_padre  INT NULL,
  activo    TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_unidad_padre FOREIGN KEY (id_padre)
    REFERENCES permiso_unidad_organica(id_unidad)
) ENGINE=InnoDB;

CREATE TABLE permiso_cargo (
  id_cargo INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(120) NOT NULL UNIQUE,
  activo   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE permiso_servidor (
  id_servidor INT AUTO_INCREMENT PRIMARY KEY,
  dni         CHAR(8) NOT NULL UNIQUE,
  apellidos   VARCHAR(120) NOT NULL,
  nombres     VARCHAR(120) NOT NULL,
  id_unidad   INT NOT NULL,
  id_cargo    INT NULL,
  id_jefe     INT NULL,
  estado      VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
  CONSTRAINT fk_serv_unidad FOREIGN KEY (id_unidad)
    REFERENCES permiso_unidad_organica(id_unidad),
  CONSTRAINT fk_serv_cargo FOREIGN KEY (id_cargo)
    REFERENCES permiso_cargo(id_cargo),
  CONSTRAINT fk_serv_jefe FOREIGN KEY (id_jefe)
    REFERENCES permiso_servidor(id_servidor),
  CONSTRAINT ck_serv_estado CHECK (estado IN ('ACTIVO','CESADO','SUSPENDIDO'))
) ENGINE=InnoDB;

CREATE TABLE permiso_usuario (
  id_usuario    INT AUTO_INCREMENT PRIMARY KEY,
  id_servidor   INT NULL,
  username      VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_usr_serv FOREIGN KEY (id_servidor)
    REFERENCES permiso_servidor(id_servidor),
  UNIQUE KEY uq_usuario_servidor (id_servidor)
) ENGINE=InnoDB;

CREATE TABLE permiso_usuario_rol (
  id_usuario INT NOT NULL,
  id_rol     INT NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  CONSTRAINT fk_ur_usr FOREIGN KEY (id_usuario)
    REFERENCES permiso_usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_ur_rol FOREIGN KEY (id_rol)
    REFERENCES permiso_rol(id_rol) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE permiso_tipo_solicitud (
  id_tipo                   INT AUTO_INCREMENT PRIMARY KEY,
  codigo                    VARCHAR(30) NOT NULL UNIQUE,
  nombre                    VARCHAR(150) NOT NULL,
  categoria                 VARCHAR(10) NOT NULL,
  con_goce                  TINYINT(1) NOT NULL DEFAULT 1,
  unidad_medida             VARCHAR(6) NOT NULL,
  max_por_solicitud         DECIMAL(6,2) NULL,
  max_por_anio              DECIMAL(6,2) NULL,
  requiere_sustento         TINYINT(1) NOT NULL DEFAULT 1,
  solo_sexo                 CHAR(1) NULL,
  permite_regularizar       TINYINT(1) NOT NULL DEFAULT 0,
  dias_calendario           TINYINT(1) NOT NULL DEFAULT 1,
  base_legal                VARCHAR(500) NULL,
  plazo_regularizacion_dias SMALLINT NULL,
  activo                    TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT ck_tipo_cat CHECK (categoria IN ('LICENCIA','PERMISO')),
  CONSTRAINT ck_tipo_um  CHECK (unidad_medida IN ('DIAS','HORAS'))
) ENGINE=InnoDB;

CREATE TABLE permiso_solicitud_papeleta (
  id_solicitud                BIGINT AUTO_INCREMENT PRIMARY KEY,
  nro_solicitud               VARCHAR(20) NOT NULL UNIQUE,
  id_servidor                 INT NOT NULL,
  id_tipo                     INT NOT NULL,
  id_jefe_solicitud           INT NULL,
  id_unidad_solicitud         INT NULL,
  id_cargo_solicitud          INT NULL,
  fecha_inicio                DATE NULL,
  fecha_fin                   DATE NULL,
  hora_inicio                 TIME NULL,
  hora_fin                    TIME NULL,
  cantidad                    DECIMAL(6,2) NOT NULL DEFAULT 0,
  motivo                      TEXT NULL,
  estado                      VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
  token_codigo                VARCHAR(16) NULL,
  es_urgente                  TINYINT(1) NOT NULL DEFAULT 0,
  fecha_limite_regularizacion DATE NULL,
  tiempo_empleado_min         INT NULL,
  mision_cumplida             TINYINT(1) NULL,
  id_usuario_visa             INT NULL,
  fecha_visa                  DATETIME NULL,
  nro_resolucion              VARCHAR(40) NULL,
  fecha_resolucion            DATE NULL,
  creado_en                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sol_serv FOREIGN KEY (id_servidor)
    REFERENCES permiso_servidor(id_servidor),
  CONSTRAINT fk_sol_tipo FOREIGN KEY (id_tipo)
    REFERENCES permiso_tipo_solicitud(id_tipo),
  CONSTRAINT fk_sol_jefe_solicitud FOREIGN KEY (id_jefe_solicitud)
    REFERENCES permiso_servidor(id_servidor),
  CONSTRAINT fk_sol_unidad_solicitud FOREIGN KEY (id_unidad_solicitud)
    REFERENCES permiso_unidad_organica(id_unidad),
  CONSTRAINT fk_sol_cargo_solicitud FOREIGN KEY (id_cargo_solicitud)
    REFERENCES permiso_cargo(id_cargo),
  CONSTRAINT fk_sol_visa FOREIGN KEY (id_usuario_visa)
    REFERENCES permiso_usuario(id_usuario),
  CONSTRAINT ck_sol_estado CHECK (estado IN
    ('BORRADOR','REGULARIZAR','PENDIENTE','OBSERVADA','APROBADA_JEFE',
     'APROBADA_RRHH','EN_CURSO','RECHAZADA','ANULADA','EJECUTADA')),
  CONSTRAINT ck_sol_cantidad CHECK (cantidad >= 0),
  CONSTRAINT ck_sol_urgente_limite
    CHECK (es_urgente = 0 OR fecha_limite_regularizacion IS NOT NULL),
  UNIQUE KEY ux_sol_token (token_codigo)
) ENGINE=InnoDB;

CREATE TABLE permiso_solicitud_adjunto (
  id_adjunto   BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud BIGINT NOT NULL,
  nombre_arch  VARCHAR(255) NOT NULL,
  ruta_arch    VARCHAR(500) NOT NULL,
  mime         VARCHAR(80) NULL,
  tamano_bytes BIGINT NULL,
  confidencial TINYINT(1) NOT NULL DEFAULT 0,
  subido_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_adj_sol FOREIGN KEY (id_solicitud)
    REFERENCES permiso_solicitud_papeleta(id_solicitud) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE permiso_solicitud_historial (
  id_hist      BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud BIGINT NOT NULL,
  estado_ant   VARCHAR(20) NULL,
  estado_new   VARCHAR(20) NOT NULL,
  id_usuario   INT NOT NULL,
  comentario   VARCHAR(500) NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_sol FOREIGN KEY (id_solicitud)
    REFERENCES permiso_solicitud_papeleta(id_solicitud) ON DELETE CASCADE,
  CONSTRAINT fk_hist_usr FOREIGN KEY (id_usuario)
    REFERENCES permiso_usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE permiso_puesto_control (
  id_puesto INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL UNIQUE,
  ubicacion VARCHAR(150) NULL,
  activo    TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE permiso_marcacion_control (
  id_marcacion       BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud       BIGINT NOT NULL,
  tipo               VARCHAR(8) NOT NULL,
  fecha_hora         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  origen             VARCHAR(10) NOT NULL,
  id_puesto          INT NULL,
  id_usuario_control INT NOT NULL,
  autorizado_por     VARCHAR(150) NULL,
  observacion        VARCHAR(500) NULL,
  CONSTRAINT fk_marc_sol FOREIGN KEY (id_solicitud)
    REFERENCES permiso_solicitud_papeleta(id_solicitud),
  CONSTRAINT fk_marc_puesto FOREIGN KEY (id_puesto)
    REFERENCES permiso_puesto_control(id_puesto),
  CONSTRAINT fk_marc_usr FOREIGN KEY (id_usuario_control)
    REFERENCES permiso_usuario(id_usuario),
  CONSTRAINT uq_marc_sol_tipo UNIQUE (id_solicitud, tipo),
  CONSTRAINT ck_marc_tipo   CHECK (tipo   IN ('SALIDA','RETORNO')),
  CONSTRAINT ck_marc_origen CHECK (origen IN ('LECTOR','MANUAL','EMERGENCIA')),
  CONSTRAINT ck_marc_obs    CHECK (origen = 'LECTOR' OR observacion IS NOT NULL)
) ENGINE=InnoDB;
CREATE INDEX ix_marc_fecha ON permiso_marcacion_control(fecha_hora);

CREATE TABLE permiso_saldo_servidor (
  id_saldo    BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_servidor INT NOT NULL,
  id_tipo     INT NOT NULL,
  anio        SMALLINT NOT NULL,
  asignado    DECIMAL(8,2) NOT NULL DEFAULT 0,
  usado       DECIMAL(8,2) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_saldo (id_servidor, id_tipo, anio),
  CONSTRAINT fk_saldo_serv FOREIGN KEY (id_servidor)
    REFERENCES permiso_servidor(id_servidor),
  CONSTRAINT fk_saldo_tipo FOREIGN KEY (id_tipo)
    REFERENCES permiso_tipo_solicitud(id_tipo)
) ENGINE=InnoDB;

CREATE TABLE permiso_feriado (
  id_feriado INT AUTO_INCREMENT PRIMARY KEY,
  fecha      DATE NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE permiso_contador (
  anio SMALLINT PRIMARY KEY,
  seq  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE permiso_configuracion (
  clave         VARCHAR(60) PRIMARY KEY,
  valor         VARCHAR(255) NOT NULL,
  descripcion   VARCHAR(255) NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;