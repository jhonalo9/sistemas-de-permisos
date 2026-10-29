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