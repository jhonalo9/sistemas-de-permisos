<?php

namespace App\Models;

use CodeIgniter\Model;

class TipoSolicitudModel extends Model
{
    protected $table         = 'permiso_tipo_solicitud';
    protected $primaryKey    = 'id_tipo';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'codigo','nombre','categoria','con_goce','unidad_medida','max_por_solicitud',
        'max_por_anio','requiere_sustento','solo_sexo','permite_regularizar',
        'dias_calendario','base_legal','plazo_regularizacion_dias','activo',
    ];

    public function activos(): array
    {
        return $this->where('activo', 1)->orderBy('categoria')->orderBy('nombre')->findAll();
    }
}