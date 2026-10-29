SET NAMES utf8mb4;
USE SistemaPermisos;

DROP PROCEDURE IF EXISTS sp_nuevo_nro_solicitud;
DELIMITER //
CREATE PROCEDURE sp_nuevo_nro_solicitud(OUT p_nro VARCHAR(20))
BEGIN
  DECLARE v_anio SMALLINT DEFAULT YEAR(CURDATE());
  DECLARE v_n    INT;
  INSERT INTO permiso_contador (anio, seq) VALUES (v_anio, 0)
    ON DUPLICATE KEY UPDATE seq = seq;
  UPDATE permiso_contador SET seq = seq + 1 WHERE anio = v_anio;
  SELECT seq INTO v_n FROM permiso_contador WHERE anio = v_anio;
  SET p_nro = CONCAT(v_anio, '-', LPAD(v_n, 6, '0'));
END//
DELIMITER ;