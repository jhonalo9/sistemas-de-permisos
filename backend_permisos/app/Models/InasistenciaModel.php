<?php

namespace App\Models;

use CodeIgniter\Model;

class InasistenciaModel extends Model
{
    protected $table         = 'permiso_inasistencia';
    protected $primaryKey    = 'id_inasistencia';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'id_servidor', 'fecha', 'tipo', 'motivo', 'fecha_comunicacion',
        'fecha_sustento', 'fecha_limite_justificacion', 'estado', 'dias_descuento',
        'id_solicitud', 'observacion', 'id_usuario_registro',
    ];
    protected $useTimestamps = false;
}
