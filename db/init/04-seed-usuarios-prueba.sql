SET NAMES utf8mb4;
USE SistemaPermisos;

-- ============================================================
-- Usuarios de prueba para el Sistema de Permisos y Licencias
-- ============================================================
-- Contraseña para TODOS los usuarios de prueba: Admin2026!
-- Hash bcrypt válido para 'Admin2026!' generado con password_hash('Admin2026!', PASSWORD_BCRYPT)
-- ============================================================

-- 1) Servidor con rol SERVIDOR (jefe de equipo)
INSERT INTO permiso_servidor (dni, apellidos, nombres, id_unidad, id_cargo, id_jefe, estado)
VALUES ('12345678', 'GARCÍA PÉREZ', 'Juan Carlos', 2,
        (SELECT id_cargo FROM permiso_cargo WHERE nombre = 'Jefe de Oficina de RRHH'), NULL, 'ACTIVO');
SET @id_servidor_jefe = LAST_INSERT_ID();

-- 2) Servidor con rol JEFE INMEDIATO (depende del servidor 1)
INSERT INTO permiso_servidor (dni, apellidos, nombres, id_unidad, id_cargo, id_jefe, estado)
VALUES ('87654321', 'LÓPEZ FERNÁNDEZ', 'María Elena', 3,
        (SELECT id_cargo FROM permiso_cargo WHERE nombre = 'Especialista RRHH'), @id_servidor_jefe, 'ACTIVO');
SET @id_servidor_jefe_inmediato = LAST_INSERT_ID();

-- 3) Servidor con rol RRHH
INSERT INTO permiso_servidor (dni, apellidos, nombres, id_unidad, id_cargo, id_jefe, estado)
VALUES ('11223344', 'RUIZ SÁNCHEZ', 'Carlos Alberto', 3,
        (SELECT id_cargo FROM permiso_cargo WHERE nombre = 'Analista RRHH'), @id_servidor_jefe_inmediato, 'ACTIVO');
SET @id_servidor_rrhh = LAST_INSERT_ID();

-- 4) Servidor con rol CONTROL DE PERSONAL
INSERT INTO permiso_servidor (dni, apellidos, nombres, id_unidad, id_cargo, id_jefe, estado)
VALUES ('55667788', 'TORRES RAMÍREZ', 'Lucía Beatriz', 4,
        (SELECT id_cargo FROM permiso_cargo WHERE nombre = 'Control de Personal'), @id_servidor_jefe_inmediato, 'ACTIVO');
SET @id_servidor_control = LAST_INSERT_ID();

-- 5) Servidor común (rol SERVIDOR) - depende del jefe inmediato
INSERT INTO permiso_servidor (dni, apellidos, nombres, id_unidad, id_cargo, id_jefe, estado)
VALUES ('99887766', 'DÍAZ MUÑOZ', 'Ana Patricia', 5,
        (SELECT id_cargo FROM permiso_cargo WHERE nombre = 'Asistente de Tesorería'), @id_servidor_jefe_inmediato, 'ACTIVO');
SET @id_servidor_comun = LAST_INSERT_ID();

-- 6) Usuario ADMIN (ya existe en 02-seed, se omite para no duplicar)

-- 7) Usuario JEFE INMEDIATO
INSERT INTO permiso_usuario (username, password_hash, nombre, id_servidor, activo)
VALUES ('jefe_inmediato',
        '$2y$12$jZl7L7AvC6Xmwm/DoClNJOeYsDUI7ua6LA4XhKfK5apSxonbL8jva',
        'Jefe Inmediato Prueba', @id_servidor_jefe_inmediato, 1);
SET @id_usuario_jefe = LAST_INSERT_ID();
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_jefe, id_rol FROM permiso_rol WHERE nombre = 'JEFE';
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_jefe, id_rol FROM permiso_rol WHERE nombre = 'SERVIDOR';

-- 8) Usuario RRHH
INSERT INTO permiso_usuario (username, password_hash, nombre, id_servidor, activo)
VALUES ('rrhh',
        '$2y$12$jZl7L7AvC6Xmwm/DoClNJOeYsDUI7ua6LA4XhKfK5apSxonbL8jva',
        'Usuario RRHH Prueba', @id_servidor_rrhh, 1);
SET @id_usuario_rrhh = LAST_INSERT_ID();
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_rrhh, id_rol FROM permiso_rol WHERE nombre = 'RRHH';
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_rrhh, id_rol FROM permiso_rol WHERE nombre = 'SERVIDOR';

-- 9) Usuario CONTROL DE PERSONAL
INSERT INTO permiso_usuario (username, password_hash, nombre, id_servidor, activo)
VALUES ('control',
        '$2y$12$jZl7L7AvC6Xmwm/DoClNJOeYsDUI7ua6LA4XhKfK5apSxonbL8jva',
        'Control Personal Prueba', @id_servidor_control, 1);
SET @id_usuario_control = LAST_INSERT_ID();
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_control, id_rol FROM permiso_rol WHERE nombre = 'CONTROL';
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_control, id_rol FROM permiso_rol WHERE nombre = 'SERVIDOR';

-- 10) Usuario SERVIDOR común
INSERT INTO permiso_usuario (username, password_hash, nombre, id_servidor, activo)
VALUES ('servidor',
        '$2y$12$jZl7L7AvC6Xmwm/DoClNJOeYsDUI7ua6LA4XhKfK5apSxonbL8jva',
        'Servidor Prueba', @id_servidor_comun, 1);
SET @id_usuario_servidor = LAST_INSERT_ID();
INSERT INTO permiso_usuario_rol (id_usuario, id_rol)
SELECT @id_usuario_servidor, id_rol FROM permiso_rol WHERE nombre = 'SERVIDOR';

-- ============================================================
-- Saldo de ejemplo para el servidor común (año 2026)
-- ============================================================
INSERT INTO permiso_saldo_servidor (id_servidor, id_tipo, anio, asignado, usado)
SELECT @id_servidor_comun, id_tipo, 2026, 40, 0
FROM permiso_tipo_solicitud
WHERE codigo = 'PER_PERSONAL' AND activo = 1;

INSERT INTO permiso_saldo_servidor (id_servidor, id_tipo, anio, asignado, usado)
SELECT @id_servidor_comun, id_tipo, 2026, 30, 0
FROM permiso_tipo_solicitud
WHERE codigo = 'LIC_SIN_GOCE' AND activo = 1;

INSERT INTO permiso_saldo_servidor (id_servidor, id_tipo, anio, asignado, usado)
SELECT @id_servidor_comun, id_tipo, 2026, 5, 0
FROM permiso_tipo_solicitud
WHERE codigo = 'LIC_FALLECIMIENTO' AND activo = 1;

-- ============================================================
-- Credenciales de prueba
-- ============================================================
-- admin         / Admin2026!  (rol: ADMIN)
-- jefe_inmediato / Admin2026!  (rol: JEFE, SERVIDOR)
-- rrhh          / Admin2026!  (rol: RRHH, SERVIDOR)
-- control       / Admin2026!  (rol: CONTROL, SERVIDOR)
-- servidor      / Admin2026!  (rol: SERVIDOR)
-- ============================================================
