<?php
namespace App\Models;
use CodeIgniter\Model;

class AdjuntoModel extends Model
{
    protected $table = 'permiso_solicitud_adjunto';
    protected $primaryKey = 'id_adjunto';
    protected $returnType = 'array';
    protected $allowedFields = ['id_solicitud','nombre_arch','ruta_arch','mime','tamano_bytes','confidencial'];
    protected $useTimestamps = false;
}