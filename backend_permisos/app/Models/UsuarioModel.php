<?php

namespace App\Models;

use CodeIgniter\Model;

class UsuarioModel extends Model
{
    protected $table         = 'permiso_usuario';
    protected $primaryKey    = 'id_usuario';
    protected $allowedFields = ['id_servidor', 'username', 'password_hash', 'nombre', 'activo'];
    protected $useTimestamps = false;

    public function porUsername(string $username): ?array
    {
        return $this->where('username', $username)->where('activo', 1)->first();
    }

    public function rolesDe(int $idUsuario): array
    {
        $rows = $this->db->table('permiso_usuario_rol ur')
            ->select('r.nombre')
            ->join('permiso_rol r', 'r.id_rol = ur.id_rol')
            ->where('ur.id_usuario', $idUsuario)
            ->get()->getResultArray();

        return array_column($rows, 'nombre');
    }

    public function conDetalle(int $idUsuario): ?array
    {
        $u = $this->find($idUsuario);
        if (! $u) return null;
        $u['roles'] = array_column(
            $this->db->table('permiso_usuario_rol ur')
                ->select('r.nombre')
                ->join('permiso_rol r', 'r.id_rol = ur.id_rol')
                ->where('ur.id_usuario', $idUsuario)
                ->get()->getResultArray(),
            'nombre'
        );
        return $u;
    }
}