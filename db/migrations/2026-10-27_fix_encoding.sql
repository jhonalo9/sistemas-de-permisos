SET NAMES utf8mb4;
USE SistemaPermisos;

-- Corregir textos sembrados que quedaron doblemente codificados.

UPDATE permiso_unidad_organica SET nombre = 'Alcaldía' WHERE id_unidad = 1;
UPDATE permiso_unidad_organica SET nombre = 'Gerencia General' WHERE id_unidad = 2;
UPDATE permiso_unidad_organica SET nombre = 'Oficina de Gestión de Recursos Humanos' WHERE id_unidad = 3;
UPDATE permiso_unidad_organica SET nombre = 'Control de Personal' WHERE id_unidad = 4;
UPDATE permiso_unidad_organica SET nombre = 'Subgerencia de Tesorería' WHERE id_unidad = 5;

UPDATE permiso_feriado SET descripcion = 'Año Nuevo' WHERE fecha = '2026-01-01';
UPDATE permiso_feriado SET descripcion = 'Jueves Santo' WHERE fecha = '2026-04-02';
UPDATE permiso_feriado SET descripcion = 'Viernes Santo' WHERE fecha = '2026-04-03';
UPDATE permiso_feriado SET descripcion = 'Día del Trabajo' WHERE fecha = '2026-05-01';
UPDATE permiso_feriado SET descripcion = 'Batalla de Arica y Día de la Bandera' WHERE fecha = '2026-06-07';
UPDATE permiso_feriado SET descripcion = 'San Pedro y San Pablo' WHERE fecha = '2026-06-29';
UPDATE permiso_feriado SET descripcion = 'Día de la Fuerza Aérea del Perú' WHERE fecha = '2026-07-23';
UPDATE permiso_feriado SET descripcion = 'Fiestas Patrias' WHERE fecha IN ('2026-07-28', '2026-07-29');
UPDATE permiso_feriado SET descripcion = 'Batalla de Junín' WHERE fecha = '2026-08-06';
UPDATE permiso_feriado SET descripcion = 'Santa Rosa de Lima' WHERE fecha = '2026-08-30';
UPDATE permiso_feriado SET descripcion = 'Combate de Angamos' WHERE fecha = '2026-10-08';
UPDATE permiso_feriado SET descripcion = 'Todos los Santos' WHERE fecha = '2026-11-01';
UPDATE permiso_feriado SET descripcion = 'Inmaculada Concepción' WHERE fecha = '2026-12-08';
UPDATE permiso_feriado SET descripcion = 'Batalla de Ayacucho' WHERE fecha = '2026-12-09';
UPDATE permiso_feriado SET descripcion = 'Navidad' WHERE fecha = '2026-12-25';

UPDATE permiso_servidor SET apellidos = 'GARCÍA PÉREZ', nombres = 'Juan Carlos' WHERE id_servidor = 1;
UPDATE permiso_servidor SET apellidos = 'LÓPEZ FERNÁNDEZ', nombres = 'María Elena' WHERE id_servidor = 2;
UPDATE permiso_servidor SET apellidos = 'RUIZ SÁNCHEZ', nombres = 'Carlos Alberto' WHERE id_servidor = 3;
UPDATE permiso_servidor SET apellidos = 'TORRES RAMÍREZ', nombres = 'Lucía Beatriz' WHERE id_servidor = 4;
UPDATE permiso_servidor SET apellidos = 'DÍAZ MUÑOZ', nombres = 'Ana Patricia' WHERE id_servidor = 5;

-- Unificar el cargo duplicado por codificación.
UPDATE permiso_cargo SET nombre = 'Asistente de Tesorería' WHERE id_cargo = 6;
UPDATE permiso_servidor SET id_cargo = 6 WHERE id_cargo = 5;
UPDATE permiso_solicitud_papeleta SET id_cargo_solicitud = 6 WHERE id_cargo_solicitud = 5;
DELETE FROM permiso_cargo WHERE id_cargo = 5;
