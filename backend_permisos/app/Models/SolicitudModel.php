<?php

namespace App\Models;

use CodeIgniter\Model;

class SolicitudModel extends Model
{
    protected $table         = 'permiso_solicitud_papeleta';
    protected $primaryKey    = 'id_solicitud';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'nro_solicitud','id_servidor','id_tipo','id_jefe_solicitud',
        'id_unidad_solicitud','id_cargo_solicitud','fecha_inicio','fecha_fin',
        'hora_inicio','hora_fin','cantidad','motivo','estado','token_codigo',
        'es_urgente','fecha_limite_regularizacion','tiempo_empleado_min',
        'mision_cumplida','id_usuario_visa','fecha_visa','nro_resolucion','fecha_resolucion',
    ];

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

    public function porServidor(int $idServidor, array $filtros, int $offset, int $limit): array
    {
        $b = $this->db->table('permiso_solicitud_papeleta s')
            ->select('s.*, t.*, t.nombre AS tipo_nombre')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->where('s.id_servidor', $idServidor)
            ->orderBy('s.creado_en', 'DESC');

        if (! empty($filtros['estado'])) $b->where('s.estado', $filtros['estado']);
        if (! empty($filtros['anio']))   $b->where('YEAR(s.creado_en)', (int) $filtros['anio']);

        $total = (clone $b)->countAllResults(false);
        $items = $b->limit($limit, $offset)->get()->getResultArray();
        $items = array_map(fn (array $item): array => $this->conTipo($item), $items);

        return ['items' => $items, 'total' => $total];
    }

    public function detalleCompleto(int $id): ?array
    {
        $s = $this->db->table('permiso_solicitud_papeleta s')
            ->select('s.*, t.*, t.nombre AS tipo_nombre,
                      sv.id_servidor AS servidor_id, sv.dni, sv.apellidos, sv.nombres,
                      COALESCE(s.id_unidad_solicitud, sv.id_unidad) AS id_unidad,
                      sv.id_jefe AS id_jefe_actual, sv.estado AS servidor_estado,
                      c.nombre AS cargo,
                      CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor_nombre,
                      u.nombre AS unidad,
                      j.id_servidor AS jefe_id, j.dni AS jefe_dni,
                      j.apellidos AS jefe_apellidos, j.nombres AS jefe_nombres,
                      CONCAT(j.apellidos, ", ", j.nombres) AS jefe_nombre')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_cargo c', 'c.id_cargo = COALESCE(s.id_cargo_solicitud, sv.id_cargo)', 'left')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->join('permiso_servidor j', 'j.id_servidor = s.id_jefe_solicitud', 'left')
            ->where('s.id_solicitud', $id)
            ->get()->getRowArray();

        if (! $s) return null;

        $s = $this->conTipo($s);
        $s['servidor'] = [
            'id_servidor' => (int) ($s['servidor_id'] ?? $s['id_servidor']),
            'dni'         => $s['dni'],
            'apellidos'   => $s['apellidos'],
            'nombres'     => $s['nombres'],
            'id_unidad'   => (int) ($s['id_unidad'] ?? 0),
            'id_jefe'     => $s['id_jefe_solicitud'] !== null
                ? (int) $s['id_jefe_solicitud']
                : ($s['id_jefe_actual'] !== null ? (int) $s['id_jefe_actual'] : null),
            'cargo'       => $s['cargo'],
            'estado'      => $s['servidor_estado'],
            'unidad'      => $s['unidad'],
        ];
        $s['jefe'] = $s['jefe_id'] ? [
            'id_servidor' => (int) $s['jefe_id'],
            'dni'         => $s['jefe_dni'],
            'apellidos'   => $s['jefe_apellidos'],
            'nombres'     => $s['jefe_nombres'],
            'nombre'      => $s['jefe_nombre'],
        ] : null;

        $s['adjuntos'] = $this->db->table('permiso_solicitud_adjunto')
            ->where('id_solicitud', $id)->get()->getResultArray();

        $s['historial'] = $this->db->table('permiso_solicitud_historial h')
            ->select('h.*, u.nombre AS usuario_nombre')
            ->join('permiso_usuario u', 'u.id_usuario = h.id_usuario')
            ->where('h.id_solicitud', $id)
            ->orderBy('h.creado_en', 'ASC')
            ->get()->getResultArray();

        $s['marcaciones'] = $this->db->table('permiso_marcacion_control')
            ->select('id_marcacion, tipo, fecha_hora, origen')
            ->where('id_solicitud', $id)->orderBy('fecha_hora', 'ASC')
            ->get()->getResultArray();

        return $s;
    }

    public function aprobadasDelEquipo(int $idJefe, int $offset, int $limit): array
    {
        $b = $this->db->table('permiso_solicitud_papeleta s')
            ->select('s.*, t.nombre AS tipo_nombre, t.categoria, t.unidad_medida,
                      CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor, sv.dni,
                      c.nombre AS cargo, u.nombre AS unidad')
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_cargo c', 'c.id_cargo = COALESCE(s.id_cargo_solicitud, sv.id_cargo)', 'left')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->where('s.id_jefe_solicitud', $idJefe)
            ->where('s.estado', 'PENDIENTE')
            ->orderBy('s.creado_en', 'ASC');
        $total = (clone $b)->countAllResults(false);
        return ['items' => $b->limit($limit, $offset)->get()->getResultArray(), 'total' => $total];
    }
}