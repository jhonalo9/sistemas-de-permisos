<?php

namespace App\Models;

use CodeIgniter\Model;

class MarcacionModel extends Model
{
    protected $table         = 'permiso_marcacion_control';
    protected $primaryKey    = 'id_marcacion';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'id_solicitud','tipo','fecha_hora','origen','id_puesto',
        'id_usuario_control','autorizado_por','observacion',
    ];
    protected $useTimestamps = false;

    public function existeTipo(int $idSolicitud, string $tipo): bool
    {
        return $this->where(['id_solicitud' => $idSolicitud, 'tipo' => $tipo])->countAllResults() > 0;
    }

    public function horaSalida(int $idSolicitud): ?string
    {
        $r = $this->where(['id_solicitud' => $idSolicitud, 'tipo' => 'SALIDA'])->first();
        return $r['fecha_hora'] ?? null;
    }

    public function fueraAhora(): array
    {
        return $this->db->query('SELECT * FROM vw_personal_fuera')->getResultArray();
    }

    public function noVolvieron(string $horaCorte): array
    {
        $hoy   = date('Y-m-d');
        $ahora = date('H:i:s');

        return $this->db->query(
            'SELECT * FROM vw_personal_fuera
             WHERE DATE(hora_salida) < ?
                OR (DATE(hora_salida) = ? AND ? >= ?)
             ORDER BY hora_salida ASC',
            [$hoy, $hoy, $ahora, $horaCorte]
        )->getResultArray();
    }
}