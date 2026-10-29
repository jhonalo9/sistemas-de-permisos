<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;

class ServidoresController extends BaseApiController
{
    public function index()
    {
        $db = db_connect();
        $q  = trim((string) $this->request->getGet('q'));

        $b = $db->table('permiso_servidor s')
            ->select('s.*, u.nombre AS unidad, c.nombre AS cargo,
                      j.dni AS jefe_dni,
                      CONCAT(j.apellidos, ", ", j.nombres) AS jefe_nombre,
                      us.id_usuario, us.username AS usuario_username')
            ->join('permiso_unidad_organica u', 'u.id_unidad = s.id_unidad')
            ->join('permiso_cargo c', 'c.id_cargo = s.id_cargo', 'left')
            ->join('permiso_servidor j', 'j.id_servidor = s.id_jefe', 'left')
            ->join('permiso_usuario us', 'us.id_servidor = s.id_servidor', 'left')
            ->orderBy('s.apellidos')->orderBy('s.nombres');

        if ($q !== '') {
            $b->groupStart()
                ->like('s.dni', $q)
                ->orLike('s.apellidos', $q)
                ->orLike('s.nombres', $q)
                ->groupEnd();
        }

        return ApiResponse::ok($b->get()->getResultArray());
    }

    public function crear()
    {
        $d = $this->datos();
        $error = $this->validar($d, null);
        if ($error !== null) return ApiResponse::error($error, 422);

        $db = db_connect();
        $db->transBegin();
        try {
            $db->table('permiso_servidor')->insert([
                'dni'       => (string) $d['dni'],
                'apellidos' => (string) $d['apellidos'],
                'nombres'   => (string) $d['nombres'],
                'id_unidad' => (int) $d['id_unidad'],
                'id_cargo'  => ! empty($d['id_cargo']) ? (int) $d['id_cargo'] : null,
                'id_jefe'   => ! empty($d['id_jefe']) ? (int) $d['id_jefe'] : null,
                'estado'    => $d['estado'] ?? 'ACTIVO',
            ]);
            $id = (int) $db->insertID();

            $this->vincularUsuario($id, $d['id_usuario'] ?? null);
            $db->transCommit();
            return ApiResponse::ok(['id_servidor' => (int) $id], 201);
        } catch (\Throwable $e) {
            $db->transRollback();
            return ApiResponse::error('No se pudo crear el servidor: ' . $e->getMessage(), 500);
        }
    }

    public function actualizar(int $id)
    {
        $db = db_connect();
        $actual = $db->table('permiso_servidor')->where('id_servidor', $id)->get()->getRowArray();
        if (! $actual) return ApiResponse::error('Servidor no encontrado.', 404);

        $d = $this->datos();
        $error = $this->validar($d, $id);
        if ($error !== null) return ApiResponse::error($error, 422);

        $update = [];
        foreach (['dni', 'apellidos', 'nombres', 'estado'] as $campo) {
            if (array_key_exists($campo, $d)) $update[$campo] = $d[$campo];
        }
        if (array_key_exists('id_unidad', $d)) $update['id_unidad'] = (int) $d['id_unidad'];
        if (array_key_exists('id_cargo', $d)) $update['id_cargo'] = ! empty($d['id_cargo']) ? (int) $d['id_cargo'] : null;
        if (array_key_exists('id_jefe', $d)) $update['id_jefe'] = ! empty($d['id_jefe']) ? (int) $d['id_jefe'] : null;

        $db->transBegin();
        try {
            if ($update !== []) {
                $db->table('permiso_servidor')->where('id_servidor', $id)->update($update);
            }
            if (array_key_exists('id_usuario', $d)) {
                $this->vincularUsuario($id, $d['id_usuario']);
            }
            $db->transCommit();
            return ApiResponse::ok(null, 200, ['mensaje' => 'Servidor actualizado.']);
        } catch (\Throwable $e) {
            $db->transRollback();
            return ApiResponse::error('No se pudo actualizar el servidor: ' . $e->getMessage(), 500);
        }
    }

    private function validar(array $d, ?int $idServidor): ?string
    {
        $dni = trim((string) ($d['dni'] ?? ''));
        if (! preg_match('/^\d{8}$/', $dni)) return 'El DNI debe tener 8 dígitos.';

        if (trim((string) ($d['apellidos'] ?? '')) === '') return 'Los apellidos son obligatorios.';
        if (trim((string) ($d['nombres'] ?? '')) === '') return 'Los nombres son obligatorios.';
        if (empty($d['id_unidad'])) return 'La unidad orgánica es obligatoria.';

        $db = db_connect();
        $dniQuery = $db->table('permiso_servidor')->where('dni', $dni);
        if ($idServidor !== null) $dniQuery->where('id_servidor !=', $idServidor);
        if ($dniQuery->countAllResults() > 0) return 'El DNI ya está registrado.';

        if (! $db->table('permiso_unidad_organica')->where('id_unidad', (int) $d['id_unidad'])->countAllResults()) {
            return 'La unidad orgánica no existe.';
        }
        if (! empty($d['id_cargo']) && ! $db->table('permiso_cargo')->where('id_cargo', (int) $d['id_cargo'])->countAllResults()) {
            return 'El cargo no existe.';
        }

        $idJefe = ! empty($d['id_jefe']) ? (int) $d['id_jefe'] : null;
        if ($idJefe !== null) {
            if ($idServidor !== null && $idJefe === $idServidor) return 'Un servidor no puede ser su propio jefe.';
            if (! $this->jefeValido($idJefe, $idServidor)) return 'La cadena de jefes no es válida.';
        }

        if (isset($d['estado']) && ! in_array($d['estado'], ['ACTIVO', 'CESADO', 'SUSPENDIDO'], true)) {
            return 'El estado no es válido.';
        }

        if (array_key_exists('id_usuario', $d) && ! empty($d['id_usuario'])) {
            $usuario = $db->table('permiso_usuario')->where('id_usuario', (int) $d['id_usuario'])->get()->getRowArray();
            if (! $usuario) return 'El usuario vinculado no existe.';
            if ($usuario['id_servidor'] !== null && (int) $usuario['id_servidor'] !== (int) $idServidor) {
                return 'El usuario ya está vinculado a otro servidor.';
            }
        }

        return null;
    }

    private function jefeValido(int $idJefe, ?int $idServidor): bool
    {
        $db = db_connect();
        $visitados = [];
        $actual = $idJefe;

        while ($actual !== null) {
            if ($idServidor !== null && (int) $actual === $idServidor) return false;
            if (isset($visitados[(int) $actual])) return false;
            $visitados[(int) $actual] = true;

            $row = $db->table('permiso_servidor')
                ->select('id_jefe')
                ->where('id_servidor', (int) $actual)
                ->get()->getRowArray();
            if (! $row) return false;
            $actual = $row['id_jefe'] !== null ? (int) $row['id_jefe'] : null;
        }

        return true;
    }

    private function vincularUsuario(int $idServidor, mixed $idUsuario): void
    {
        $db = db_connect();

        if (empty($idUsuario)) {
            $db->table('permiso_usuario')->where('id_servidor', $idServidor)->update(['id_servidor' => null]);
            return;
        }

        $idUsuario = (int) $idUsuario;
        $usuario = $db->table('permiso_usuario')->where('id_usuario', $idUsuario)->get()->getRowArray();
        if (! $usuario) throw new \RuntimeException('Usuario no encontrado.');
        if ($usuario['id_servidor'] !== null && (int) $usuario['id_servidor'] !== $idServidor) {
            throw new \RuntimeException('El usuario ya está vinculado a otro servidor.');
        }

        $db->table('permiso_usuario')->where('id_servidor', $idServidor)->update(['id_servidor' => null]);
        $db->table('permiso_usuario')->where('id_usuario', $idUsuario)->update(['id_servidor' => $idServidor]);
    }
}
