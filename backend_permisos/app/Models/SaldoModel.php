<?php

namespace App\Models;

use CodeIgniter\Model;

class SaldoModel extends Model
{
    protected $table         = 'permiso_saldo_servidor';
    protected $primaryKey    = 'id_saldo';
    protected $returnType    = 'array';
    protected $allowedFields = ['id_servidor','id_tipo','anio','asignado','usado'];

    private const TIPO_COLUMNS = [
        'id_tipo', 'codigo', 'nombre', 'categoria', 'con_goce', 'unidad_medida',
        'max_por_solicitud', 'max_por_anio', 'requiere_sustento', 'solo_sexo',
        'permite_regularizar', 'dias_calendario', 'base_legal',
        'plazo_regularizacion_dias', 'activo',
    ];

    private const ESTADOS_APROBADOS = [
        'APROBADA_JEFE', 'APROBADA', 'APROBADA_RRHH', 'PENDIENTE_GERENCIA',
        'EN_CURSO', 'EJECUTADA',
    ];

    private const ESTADOS_CONSUMIDOS = ['APROBADA_RRHH', 'EN_CURSO', 'EJECUTADA'];

    private function conTipo(array $row): array
    {
        $tipo = [];
        foreach (self::TIPO_COLUMNS as $columna) {
            if (array_key_exists($columna, $row)) {
                $tipo[$columna] = $row[$columna];
            }
        }

        $tipo['id_tipo']                   = (int) ($tipo['id_tipo'] ?? 0);
        $tipo['con_goce']                  = (int) ($tipo['con_goce'] ?? 0);
        $tipo['requiere_sustento']         = (int) ($tipo['requiere_sustento'] ?? 0);
        $tipo['permite_regularizar']       = (int) ($tipo['permite_regularizar'] ?? 0);
        $tipo['dias_calendario']           = (int) ($tipo['dias_calendario'] ?? 0);
        $tipo['activo']                    = (int) ($tipo['activo'] ?? 0);
        $tipo['max_por_solicitud']         = isset($tipo['max_por_solicitud']) && $tipo['max_por_solicitud'] !== null ? (float) $tipo['max_por_solicitud'] : null;
        $tipo['max_por_anio']              = isset($tipo['max_por_anio']) && $tipo['max_por_anio'] !== null ? (float) $tipo['max_por_anio'] : null;
        $tipo['plazo_regularizacion_dias'] = isset($tipo['plazo_regularizacion_dias']) && $tipo['plazo_regularizacion_dias'] !== null ? (int) $tipo['plazo_regularizacion_dias'] : null;

        $row['tipo'] = $tipo;

        return $row;
    }

    public function delServidor(int $idServidor, int $anio): array
    {
        $rows = $this->db->table('permiso_saldo_servidor sa')
            ->select('sa.*, t.*, t.nombre AS tipo_nombre,
                      (sa.asignado - sa.usado) AS disponible')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = sa.id_tipo')
            ->where('sa.id_servidor', $idServidor)
            ->where('sa.anio', $anio)
            ->get()->getResultArray();

        return array_map(fn (array $row): array => $this->conTipo($row), $rows);
    }

    public function mensualesDelServidor(int $idServidor, int $anio, int $mes): array
    {
        $desde = sprintf('%04d-%02d-01', $anio, $mes);
        $hasta = date('Y-m-t', strtotime($desde));

        $tipos = $this->db->table('permiso_tipo_solicitud')
            ->select('id_tipo, codigo, nombre, categoria, unidad_medida,
                      max_solicitudes_mes, max_por_solicitud, max_horas_dia, max_horas_semana,
                      max_por_anio')
            ->where('activo', 1)
            ->where('codigo !=', 'PER_EMERGENCIA')
            ->orderBy('categoria')
            ->orderBy('nombre')
            ->get()->getResultArray();

        $saldosAnuales = $this->db->table('permiso_saldo_servidor')
            ->select('id_tipo, asignado, usado')
            ->where('id_servidor', $idServidor)
            ->where('anio', $anio)
            ->get()->getResultArray();

        $saldoPorTipo = [];
        foreach ($saldosAnuales as $saldo) {
            $saldoPorTipo[(int) $saldo['id_tipo']] = [
                'asignado' => (float) $saldo['asignado'],
                'usado'    => (float) $saldo['usado'],
            ];
        }

        $consumoAnual = $this->db->table('permiso_solicitud_papeleta')
            ->select('id_tipo, SUM(cantidad) AS cantidad')
            ->where('id_servidor', $idServidor)
            ->where('fecha_inicio >=', $anio . '-01-01')
            ->where('fecha_inicio <=', $anio . '-12-31')
            ->whereIn('estado', self::ESTADOS_CONSUMIDOS)
            ->groupBy('id_tipo')
            ->get()->getResultArray();

        $consumoPorTipo = [];
        foreach ($consumoAnual as $consumo) {
            $consumoPorTipo[(int) $consumo['id_tipo']] = (float) $consumo['cantidad'];
        }

        $movimientos = $this->db->table('permiso_solicitud_papeleta')
            ->select('id_tipo, estado, COUNT(*) AS total, SUM(cantidad) AS cantidad')
            ->where('id_servidor', $idServidor)
            ->where('fecha_inicio >=', $desde)
            ->where('fecha_inicio <=', $hasta)
            ->whereIn('estado', self::ESTADOS_APROBADOS)
            ->groupBy('id_tipo, estado')
            ->get()->getResultArray();

        $resumen = [];
        foreach ($movimientos as $m) {
            $idTipo = (int) $m['id_tipo'];
            if (! isset($resumen[$idTipo])) {
                $resumen[$idTipo] = ['usadas' => 0, 'cantidad' => 0.0, 'estados' => []];
            }

            $total = (int) $m['total'];
            $resumen[$idTipo]['usadas'] += $total;
            $resumen[$idTipo]['estados'][$m['estado']] = $total;

            if (in_array($m['estado'], self::ESTADOS_CONSUMIDOS, true)) {
                $resumen[$idTipo]['cantidad'] += (float) $m['cantidad'];
            }
        }

        foreach ($tipos as &$tipo) {
            $idTipo = (int) $tipo['id_tipo'];
            $datos  = $resumen[$idTipo] ?? ['usadas' => 0, 'cantidad' => 0.0, 'estados' => []];
            $limite = $tipo['max_solicitudes_mes'] !== null
                ? (int) $tipo['max_solicitudes_mes']
                : null;

            $tipo['id_tipo']            = $idTipo;
            $tipo['max_solicitudes_mes'] = $limite;
            $tipo['usadas']             = $datos['usadas'];
            $tipo['disponibles']        = $limite === null ? null : max(0, $limite - $datos['usadas']);
            $tipo['alcanzado']          = $limite !== null && $datos['usadas'] >= $limite;
            $tipo['cantidad_usada']     = round($datos['cantidad'], 2);
            $tipo['por_estado']         = $datos['estados'];

            $topeAnual = $tipo['max_por_anio'] !== null
                ? (float) $tipo['max_por_anio']
                : null;
            $saldoAnual = $saldoPorTipo[$idTipo] ?? null;
            $asignadoAnual = $saldoAnual !== null ? $saldoAnual['asignado'] : $topeAnual;
            $usadoAnual = $saldoAnual !== null
                ? $saldoAnual['usado']
                : ($consumoPorTipo[$idTipo] ?? 0.0);

            $tipo['max_por_anio']       = $topeAnual;
            $tipo['asignado_anual']     = $asignadoAnual;
            $tipo['usado_anual']        = round($usadoAnual, 2);
            $tipo['disponible_anual']   = $asignadoAnual === null
                ? null
                : round($asignadoAnual - $usadoAnual, 2);
            $tipo['alcanzado_anual']    = $asignadoAnual !== null && $usadoAnual >= $asignadoAnual;
        }

        return $tipos;
    }

    /** Suma el consumo de una solicitud aprobada al saldo del año correspondiente. */
    public function consumir(int $idServidor, int $idTipo, int $anio, float $cantidad): void
    {
        $existe = $this->where(['id_servidor' => $idServidor, 'id_tipo' => $idTipo, 'anio' => $anio])->first();
        if ($existe) {
            $this->update($existe['id_saldo'], ['usado' => $existe['usado'] + $cantidad]);
            return;
        }

        $tipo = db_connect()->table('permiso_tipo_solicitud')
            ->where('id_tipo', $idTipo)
            ->get()->getRowArray();

        if (! $tipo || $tipo['max_por_anio'] === null) {
            return;
        }

        $this->insert([
            'id_servidor' => $idServidor,
            'id_tipo'     => $idTipo,
            'anio'        => $anio,
            'asignado'    => (float) $tipo['max_por_anio'],
            'usado'       => $cantidad,
        ]);
    }
}