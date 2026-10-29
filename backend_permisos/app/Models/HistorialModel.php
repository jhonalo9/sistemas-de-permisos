<?php
namespace App\Models;
use CodeIgniter\Model;


class HistorialModel extends Model
{
    protected $table = 'permiso_solicitud_historial';
    protected $primaryKey = 'id_hist';
    protected $returnType = 'array';
    protected $allowedFields = ['id_solicitud','estado_ant','estado_new','id_usuario','comentario'];
    protected $useTimestamps = false;
}