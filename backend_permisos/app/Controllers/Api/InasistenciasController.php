<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\InasistenciaModel;

class InasistenciasController extends BaseApiController
{
    private const TIPOS = ['ENFERMEDAD', 'JUSTIFICADA', 'INJUSTIFICADA', 'ABANDONO'];
    private const ESTADOS = ['REGISTRADA', 'JUSTIFICADA', 'INJUSTIFICADA', 'CON_DESCUENTO', 'ANULADA'];

    public function index()
    {
        $mes  = $this->request->getGet('mes');
        $anio = $this->request->getGet('anio');
        $q    = trim((string) $this->request->getGet('q'));

        $b = db_connect()->table('permiso_inasistencia i')
            ->select('i.*, CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                      sv.dni, sv.remuneracion_mensual,
                      u.nombre AS unidad, c.nombre AS cargo')
            ->join('permiso_servidor sv', 'sv.id_servidor = i.id_servidor')
            ->join('permiso_unidad_organica u', 'u.id_unidad = sv.id_unidad')
            ->join('permiso_cargo c', 'c.id_cargo = sv.id_cargo', 'left')
            ->orderBy('i.fecha', 'DESC');

        if (! empty($anio)) {
            $b->where('i.fecha >=', $anio . '-01-01')->where('i.fecha <=', $anio . '-12-31');
        }
        if (! empty($anio) && ! empty($mes)) {
            $b->where('i.fecha >=', $anio . '-' . $mes . '-01')
              ->where('i.fecha <=', date('Y-m-t', strtotime($anio . '-' . $mes . '-01')));
        }
        if ($q !== '') {
            $b->groupStart()
                ->like('sv.dni', $q)
                ->orLike('sv.apellidos', $q)
                ->orLike('sv.nombres', $q)
                ->groupEnd();
        }

        return ApiResponse::ok($b->limit(500)->get()->getResultArray());
    }

    public function crear()
    {
        $d = $this->datos();
        $error = $this->validar($d, false);
        if ($error !== null) return ApiResponse::error($error, 422);

        $tipo = (string) $d['tipo'];
        $dias = array_key_exists('dias_descuento', $d) && $d['dias_descuento'] !== ''
            ? max(0, (float) $d['dias_descuento'])
            : (in_array($tipo, ['INJUSTIFICADA', 'ABANDONO'], true) ? 1 : 0);

        $estado = in_array($d['estado'] ?? '', self::ESTADOS, true)
            ? $d['estado']
            : 'REGISTRADA';

        try {
            $id = (new InasistenciaModel())->insert([
                'id_servidor'        => (int) $d['id_servidor'],
                'fecha'              => $d['fecha'],
                'tipo'               => $tipo,
                'motivo'             => ! empty($d['motivo']) ? $d['motivo'] : null,
                'fecha_comunicacion' => ! empty($d['fecha_comunicacion']) ? $d['fecha_comunicacion'] : null,
                'fecha_sustento'     => ! empty($d['fecha_sustento']) ? $d['fecha_sustento'] : null,
                'fecha_limite_justificacion' => $this->fechaLimiteJustificacion(
                    (string) $d['fecha'],
                    $tipo
                ),
                'estado'             => $estado,
                'dias_descuento'     => $dias,
                'id_solicitud'       => ! empty($d['id_solicitud']) ? (int) $d['id_solicitud'] : null,
                'observacion'        => $d['observacion'] ?? null,
                'id_usuario_registro' => $this->idUsuario(),
            ]);
            return ApiResponse::ok(['id_inasistencia' => $id], 201);
        } catch (\Throwable $e) {
            return ApiResponse::error('No se pudo registrar la inasistencia. Verifique que no exista otra para ese servidor y fecha.', 409);
        }
    }

    public function actualizar(int $id)
    {
        if (! $this->tieneRol('RRHH', 'ADMIN')) {
            return ApiResponse::error('Solo RRHH puede modificar una inasistencia.', 403);
        }

        $actual = (new InasistenciaModel())->find($id);
        if (! $actual) return ApiResponse::error('Inasistencia no encontrada.', 404);

        $d = $this->datos();
        $update = [];
        foreach (['motivo', 'fecha_comunicacion', 'fecha_sustento', 'observacion'] as $campo) {
            if (array_key_exists($campo, $d)) {
                $update[$campo] = ($d[$campo] === '' || $d[$campo] === null) ? null : $d[$campo];
            }
        }
        if (array_key_exists('estado', $d)) {
            if (! in_array($d['estado'], self::ESTADOS, true)) {
                return ApiResponse::error('Estado de inasistencia no válido.', 422);
            }
            $update['estado'] = $d['estado'];
        }
        if (array_key_exists('dias_descuento', $d)) {
            if (! is_numeric($d['dias_descuento']) || (float) $d['dias_descuento'] < 0) {
                return ApiResponse::error('Los días de descuento deben ser un número mayor o igual a cero.', 422);
            }
            $update['dias_descuento'] = (float) $d['dias_descuento'];
        }

        if (($update['estado'] ?? null) === 'ANULADA') {
            $update['dias_descuento'] = 0;
        }

        if ($update === []) return ApiResponse::error('No hay cambios para guardar.', 422);

        (new InasistenciaModel())->update($id, $update);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Inasistencia actualizada.']);
    }

    private function fechaLimiteJustificacion(string $fecha, string $tipo): ?string
    {
        $clave = match ($tipo) {
            'ABANDONO'   => 'dias_justificacion_abandono',
            'ENFERMEDAD' => 'dias_justificacion_enfermedad',
            default      => null,
        };
        if ($clave === null) return null;

        $row = db_connect()->table('permiso_configuracion')
            ->where('clave', $clave)->get()->getRowArray();
        $dias = (int) ($row['valor'] ?? ($tipo === 'ABANDONO' ? 1 : 3));
        if ($dias < 0) $dias = 0;

        $feriados = array_column(
            db_connect()->table('permiso_feriado')->get()->getResultArray(), 'fecha'
        );
        $t = strtotime($fecha);
        if ($t === false) return null;

        $sumados = 0;
        while ($sumados < $dias) {
            $t = strtotime(date('Y-m-d', $t) . ' +1 day');
            $dow = (int) date('N', $t);
            if ($dow >= 6) continue;
            if (in_array(date('Y-m-d', $t), $feriados, true)) continue;
            $sumados++;
        }

        return date('Y-m-d', $t);
    }

    private function validar(array $d, bool $esEdicion): ?string
    {
        if (! $esEdicion) {
            if (empty($d['id_servidor'])) return 'Seleccione un servidor.';
            if (empty($d['fecha']) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $d['fecha'])) {
                return 'Indique una fecha válida.';
            }
            if (! in_array($d['tipo'] ?? '', self::TIPOS, true)) {
                return 'Seleccione un tipo de inasistencia válido.';
            }
            if (! db_connect()->table('permiso_servidor')->where('id_servidor', (int) $d['id_servidor'])->countAllResults()) {
                return 'El servidor no existe.';
            }
        }

        foreach (['fecha_comunicacion', 'fecha_sustento'] as $campo) {
            if (! empty($d[$campo]) && ! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $d[$campo])) {
                return 'Las fechas de comunicación y sustento deben ser válidas.';
            }
        }

        return null;
    }
}
