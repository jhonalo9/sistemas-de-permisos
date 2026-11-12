<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportesController extends BaseApiController
{
    public function ausentismo()
    {
        [$mes, $anio] = $this->periodo();
        return ApiResponse::ok($this->dataAusentismo($mes, $anio));
    }

    public function descuentos()
    {
        [$mes, $anio] = $this->periodo();
        return ApiResponse::ok($this->dataDescuentos($mes, $anio));
    }

    public function licencias()
    {
        [$mes, $anio] = $this->periodo();
        return ApiResponse::ok($this->dataLicencias($mes, $anio));
    }

    public function saldos()
    {
        $anio = (int) ($this->request->getGet('anio') ?? date('Y'));
        return ApiResponse::ok($this->dataSaldos($anio));
    }

    public function exportar()
    {
        $tipo = (string) ($this->request->getGet('tipo') ?? 'ausentismo');
        [$mes, $anio] = $this->periodo();

        $data = match ($tipo) {
            'descuentos' => $this->dataDescuentos($mes, $anio),
            'licencias'  => $this->dataLicencias($mes, $anio),
            'saldos'     => $this->dataSaldos($anio),
            default      => $this->dataAusentismo($mes, $anio),
        };

        $titulos = match ($tipo) {
            'descuentos' => ['DNI', 'Servidor', 'Tipo', 'Días sin goce', 'Remuneración mensual', 'Monto estimado'],
            'licencias'  => ['N.º solicitud', 'DNI', 'Servidor', 'Cargo', 'Unidad', 'Tipo', 'Fecha inicio', 'Fecha fin', 'Cantidad', 'Estado', 'Resolución'],
            'saldos'     => ['DNI', 'Servidor', 'Cargo', 'Unidad', 'Tipo', 'Año', 'Asignado', 'Usado', 'Disponible'],
            default      => ['Unidad', 'Total solicitudes', 'Total cantidad', 'Unidad de medida'],
        };

        $filas = array_map(fn (array $row) => array_values($row), $data);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(ucfirst($tipo));
        $sheet->fromArray($titulos, null, 'A1');
        if ($filas !== []) {
            $sheet->fromArray($filas, null, 'A2');
        }
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->getFont()->setBold(true);

        foreach (range('A', $sheet->getHighestColumn()) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $contenido = (string) ob_get_clean();
        $spreadsheet->disconnectWorksheets();

        $nombre = 'reporte_' . $tipo . '_' . date('Ymd_His') . '.xlsx';
        return service('response')
            ->setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->setHeader('Content-Disposition', 'attachment; filename="' . $nombre . '"')
            ->setBody($contenido);
    }

    private function periodo(): array
    {
        $mes  = (int) ($this->request->getGet('mes') ?? date('m'));
        $anio = (int) ($this->request->getGet('anio') ?? date('Y'));
        return [$mes, $anio];
    }

    private function dataAusentismo(int $mes, int $anio): array
    {
        $db = db_connect();

        $solicitudes = $db->query(
            'SELECT u.nombre AS unidad,
                    COUNT(*) AS total_solicitudes,
                    SUM(s.cantidad) AS total_cantidad,
                    t.unidad_medida
             FROM permiso_solicitud_papeleta s
             JOIN permiso_servidor sv ON sv.id_servidor = s.id_servidor
             JOIN permiso_unidad_organica u
               ON u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)
             JOIN permiso_tipo_solicitud t ON t.id_tipo = s.id_tipo
             WHERE YEAR(s.fecha_inicio) = ? AND MONTH(s.fecha_inicio) = ?
               AND s.estado IN ("APROBADA_RRHH","EN_CURSO","EJECUTADA")
             GROUP BY u.nombre, t.unidad_medida
             ORDER BY total_cantidad DESC',
            [$anio, $mes]
        )->getResultArray();

        $inasistencias = $db->query(
            'SELECT u.nombre AS unidad,
                    COUNT(*) AS total_solicitudes,
                    SUM(i.dias_descuento) AS total_cantidad,
                    "DIAS" AS unidad_medida
             FROM permiso_inasistencia i
             JOIN permiso_servidor sv ON sv.id_servidor = i.id_servidor
             JOIN permiso_unidad_organica u ON u.id_unidad = sv.id_unidad
             WHERE YEAR(i.fecha) = ? AND MONTH(i.fecha) = ?
               AND i.estado IN ("REGISTRADA","JUSTIFICADA","INJUSTIFICADA","CON_DESCUENTO")
             GROUP BY u.nombre
             ORDER BY total_cantidad DESC',
            [$anio, $mes]
        )->getResultArray();

        return array_merge($solicitudes, $inasistencias);
    }

    private function dataDescuentos(int $mes, int $anio): array
    {
        $db = db_connect();

        $licencias = $db->query(
            'SELECT sv.dni, CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                    t.nombre AS tipo, SUM(s.cantidad) AS dias_sin_goce,
                    sv.remuneracion_mensual,
                    CASE WHEN sv.remuneracion_mensual IS NULL THEN NULL
                         ELSE ROUND((sv.remuneracion_mensual / 30) * SUM(s.cantidad), 2) END AS monto_descuento
             FROM permiso_solicitud_papeleta s
             JOIN permiso_servidor sv ON sv.id_servidor = s.id_servidor
             JOIN permiso_tipo_solicitud t ON t.id_tipo = s.id_tipo
             WHERE t.con_goce = 0 AND t.unidad_medida = "DIAS"
               AND YEAR(s.fecha_inicio) = ? AND MONTH(s.fecha_inicio) = ?
               AND s.estado IN ("APROBADA_RRHH","EN_CURSO","EJECUTADA")
             GROUP BY sv.dni, servidor, t.nombre, sv.remuneracion_mensual
             ORDER BY servidor',
            [$anio, $mes]
        )->getResultArray();

        $inasistencias = $db->query(
            'SELECT sv.dni, CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                    CASE WHEN i.tipo = "ABANDONO"
                         THEN "Abandono de centro de labores"
                         ELSE "Inasistencia injustificada" END AS tipo,
                    SUM(i.dias_descuento) AS dias_sin_goce,
                    sv.remuneracion_mensual,
                    CASE WHEN sv.remuneracion_mensual IS NULL THEN NULL
                         ELSE ROUND((sv.remuneracion_mensual / 30) * SUM(i.dias_descuento), 2) END AS monto_descuento
             FROM permiso_inasistencia i
             JOIN permiso_servidor sv ON sv.id_servidor = i.id_servidor
             WHERE i.estado IN ("INJUSTIFICADA", "CON_DESCUENTO")
               AND YEAR(i.fecha) = ? AND MONTH(i.fecha) = ?
             GROUP BY sv.dni, servidor, i.tipo, sv.remuneracion_mensual
             ORDER BY servidor',
            [$anio, $mes]
        )->getResultArray();

        return array_merge($licencias, $inasistencias);
    }

    private function dataLicencias(int $mes, int $anio): array
    {
        return db_connect()->query(
            'SELECT s.nro_solicitud, sv.dni,
                    CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                    c.nombre AS cargo, u.nombre AS unidad,
                    t.nombre AS tipo, s.fecha_inicio, s.fecha_fin,
                    s.cantidad, s.estado, s.nro_resolucion
             FROM permiso_solicitud_papeleta s
             JOIN permiso_servidor sv ON sv.id_servidor = s.id_servidor
             JOIN permiso_tipo_solicitud t ON t.id_tipo = s.id_tipo
             LEFT JOIN permiso_cargo c
               ON c.id_cargo = COALESCE(s.id_cargo_solicitud, sv.id_cargo)
             JOIN permiso_unidad_organica u
               ON u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)
             WHERE t.categoria = "LICENCIA"
               AND YEAR(s.fecha_inicio) = ? AND MONTH(s.fecha_inicio) = ?
               AND s.estado IN ("APROBADA_RRHH","EN_CURSO","EJECUTADA")
             ORDER BY servidor, s.fecha_inicio',
            [$anio, $mes]
        )->getResultArray();
    }

    private function dataSaldos(int $anio): array
    {
        return db_connect()->query(
            'SELECT sv.dni, CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                    c.nombre AS cargo, u.nombre AS unidad,
                    t.nombre AS tipo, sa.anio, sa.asignado, sa.usado,
                    (sa.asignado - sa.usado) AS disponible
             FROM permiso_saldo_servidor sa
             JOIN permiso_servidor sv ON sv.id_servidor = sa.id_servidor
             JOIN permiso_tipo_solicitud t ON t.id_tipo = sa.id_tipo
             LEFT JOIN permiso_cargo c ON c.id_cargo = sv.id_cargo
             JOIN permiso_unidad_organica u ON u.id_unidad = sv.id_unidad
             WHERE sa.anio = ?
             ORDER BY servidor, tipo',
            [$anio]
        )->getResultArray();
    }
}
