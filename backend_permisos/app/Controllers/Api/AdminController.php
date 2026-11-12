<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\TipoSolicitudModel;
use App\Models\UsuarioModel;

class AdminController extends BaseApiController
{
    // ----- Tipos -----
    public function listarTipos()
    {
        $activos = $this->request->getGet('activo');
        $m = new TipoSolicitudModel();
        $rows = $activos === null ? $m->findAll() : $m->where('activo', (int) $activos)->findAll();

        $db = db_connect();
        foreach ($rows as &$r) {
            $r['condiciones'] = $db->table('permiso_tipo_condicion')
                ->where('id_tipo', $r['id_tipo'])
                ->orderBy('id_condicion')
                ->get()->getResultArray();
        }

        return ApiResponse::ok($rows);
    }

    public function crearCondicion(int $idTipo)
    {
        if (! db_connect()->table('permiso_tipo_solicitud')->where('id_tipo', $idTipo)->countAllResults()) {
            return ApiResponse::error('Tipo de solicitud no encontrado.', 404);
        }
        $d = $this->datos();
        if (empty($d['codigo']) || empty($d['nombre'])) {
            return ApiResponse::error('El código y el nombre de la condición son obligatorios.', 422);
        }
        if (isset($d['dias_extra']) && (! is_numeric($d['dias_extra']) || (float) $d['dias_extra'] < 0)) {
            return ApiResponse::error('Los días extra deben ser un número mayor o igual a cero.', 422);
        }

        $db = db_connect();
        try {
            $db->table('permiso_tipo_condicion')->insert([
                'id_tipo'         => $idTipo,
                'codigo'          => strtoupper(trim((string) $d['codigo'])),
                'nombre'          => trim((string) $d['nombre']),
                'dias_extra'      => (float) ($d['dias_extra'] ?? 0),
                'dias_calendario' => array_key_exists('dias_calendario', $d) ? (int) (bool) $d['dias_calendario'] : 1,
                'grupo'           => ! empty($d['grupo']) ? strtoupper(trim((string) $d['grupo'])) : null,
                'descripcion'     => $d['descripcion'] ?? null,
                'activo'          => array_key_exists('activo', $d) ? (int) (bool) $d['activo'] : 1,
            ]);
            return ApiResponse::ok(['id_condicion' => (int) $db->insertID()], 201);
        } catch (\Throwable $e) {
            return ApiResponse::error('No se pudo crear la condición. Verifique que el código no se repita para este tipo.', 409);
        }
    }

    public function actualizarCondicion(int $id)
    {
        $d = $this->datos();
        if ($d === []) return ApiResponse::error('Datos inválidos.', 422);

        $update = [];
        foreach (['codigo', 'nombre', 'grupo', 'descripcion'] as $campo) {
            if (array_key_exists($campo, $d)) {
                $valor = $d[$campo];
                if ($valor === '' || $valor === null) {
                    $update[$campo] = null;
                } elseif (in_array($campo, ['codigo', 'grupo'], true)) {
                    $update[$campo] = strtoupper(trim((string) $valor));
                } else {
                    $update[$campo] = trim((string) $valor);
                }
            }
        }
        if (array_key_exists('dias_extra', $d)) {
            if (! is_numeric($d['dias_extra']) || (float) $d['dias_extra'] < 0) {
                return ApiResponse::error('Los días extra deben ser un número mayor o igual a cero.', 422);
            }
            $update['dias_extra'] = (float) $d['dias_extra'];
        }
        if (array_key_exists('dias_calendario', $d)) $update['dias_calendario'] = (int) (bool) $d['dias_calendario'];
        if (array_key_exists('activo', $d)) $update['activo'] = (int) (bool) $d['activo'];

        if ($update === []) return ApiResponse::error('No hay cambios para guardar.', 422);

        db_connect()->table('permiso_tipo_condicion')->where('id_condicion', $id)->update($update);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Condición actualizada.']);
    }

    public function eliminarCondicion(int $id)
    {
        db_connect()->table('permiso_tipo_condicion')->where('id_condicion', $id)->delete();
        return ApiResponse::ok(null, 200, ['mensaje' => 'Condición eliminada.']);
    }

    public function crearTipo()
    {
        $id = (new TipoSolicitudModel())->insert($this->datos());
        return ApiResponse::ok(['id_tipo' => $id], 201);
    }

    public function actualizarTipo(int $id)
    {
        $d = $this->datos();
        if ($d === []) return ApiResponse::error('Datos inválidos.', 422);
        (new TipoSolicitudModel())->update($id, $d);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Tipo actualizado.']);
    }

    // ----- Usuarios -----
    public function listarUsuarios()
    {
        $rows = db_connect()->table('permiso_usuario u')
            ->select('u.id_usuario, u.username, u.nombre, u.activo, u.id_servidor')
            ->orderBy('u.nombre')->get()->getResultArray();
        foreach ($rows as &$r) {
            $r['roles'] = array_column(
                db_connect()->table('permiso_usuario_rol ur')
                    ->select('r.nombre')
                    ->join('permiso_rol r', 'r.id_rol = ur.id_rol')
                    ->where('ur.id_usuario', $r['id_usuario'])->get()->getResultArray(),
                'nombre'
            );
        }
        return ApiResponse::ok($rows);
    }

    public function crearUsuario()
    {
        $d = $this->datos();
        if (empty($d['username']) || empty($d['password']) || empty($d['nombre'])) {
            return ApiResponse::error('Faltan campos obligatorios.', 422);
        }
        $m = new UsuarioModel();
        if ($m->where('username', $d['username'])->first()) {
            return ApiResponse::error('El usuario ya existe.', 409);
        }

        $idServidor = ! empty($d['id_servidor']) ? (int) $d['id_servidor'] : null;
        if ($this->servidorOcupado($idServidor)) {
            return ApiResponse::error('El servidor ya tiene un usuario vinculado.', 409);
        }

        $id = $m->insert([
            'username'      => $d['username'],
            'password_hash' => password_hash($d['password'], PASSWORD_BCRYPT),
            'nombre'        => $d['nombre'],
            'id_servidor'   => $idServidor,
            'activo'        => 1,
        ]);
        if (! empty($d['roles']) && is_array($d['roles'])) {
            $this->asignarRolesA($id, $d['roles']);
        }
        return ApiResponse::ok(['id_usuario' => $id], 201);
    }

    public function actualizarUsuario(int $id)
    {
        $d     = $this->datos();
        $roles = $d['roles'] ?? null;
        unset($d['roles']);

        if ($d === [] && ! is_array($roles)) {
            return ApiResponse::error('Datos inválidos.', 422);
        }

        if (array_key_exists('id_servidor', $d)) {
            $d['id_servidor'] = ! empty($d['id_servidor']) ? (int) $d['id_servidor'] : null;
            if ($this->servidorOcupado($d['id_servidor'], $id)) {
                return ApiResponse::error('El servidor ya tiene otro usuario vinculado.', 409);
            }
        }

        if (! empty($d['password'])) {
            $d['password_hash'] = password_hash($d['password'], PASSWORD_BCRYPT);
            unset($d['password']);
        }

        if ($d !== []) {
            (new UsuarioModel())->update($id, $d);
        }

        if (is_array($roles)) {
            $this->asignarRolesA($id, $roles);
        }

        return ApiResponse::ok(null, 200, ['mensaje' => 'Usuario actualizado.']);
    }

    public function asignarRoles(int $id)
    {
        $d = $this->datos();
        if (empty($d['roles']) || ! is_array($d['roles'])) return ApiResponse::error('Lista de roles requerida.', 422);
        $this->asignarRolesA($id, $d['roles']);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Roles actualizados.']);
    }

    // ----- Feriados -----
    public function listarFeriados()
    {
        return ApiResponse::ok(db_connect()->table('permiso_feriado')->orderBy('fecha')->get()->getResultArray());
    }

    public function crearFeriado()
    {
        $db = db_connect();
        $db->table('permiso_feriado')->insert($this->datos());
        return ApiResponse::ok(['id_feriado' => (int) $db->insertID()], 201);
    }

    public function eliminarFeriado(int $id)
    {
        db_connect()->table('permiso_feriado')->where('id_feriado', $id)->delete();
        return ApiResponse::ok(null, 200, ['mensaje' => 'Feriado eliminado.']);
    }

    // ----- Unidades -----
    public function listarUnidades()
    {
        return ApiResponse::ok(db_connect()->table('permiso_unidad_organica')->orderBy('nombre')->get()->getResultArray());
    }

    public function crearUnidad()
    {
        $d = $this->datos();
        if (empty($d['nombre'])) return ApiResponse::error('El nombre de la unidad es obligatorio.', 422);

        $idPadre = ! empty($d['id_padre']) ? (int) $d['id_padre'] : null;
        if ($idPadre !== null && ! $this->unidadPadreValido($idPadre, null)) {
            return ApiResponse::error('La unidad padre no es válida.', 422);
        }

        $db = db_connect();
        $db->table('permiso_unidad_organica')->insert([
            'nombre'   => trim((string) $d['nombre']),
            'id_padre' => $idPadre,
            'activo'   => array_key_exists('activo', $d) ? (int) (bool) $d['activo'] : 1,
        ]);
        return ApiResponse::ok(['id_unidad' => (int) $db->insertID()], 201);
    }

    public function actualizarUnidad(int $id)
    {
        $d = $this->datos();
        if ($d === []) return ApiResponse::error('Datos inválidos.', 422);

        if (array_key_exists('id_padre', $d)) {
            $idPadre = ! empty($d['id_padre']) ? (int) $d['id_padre'] : null;
            if ($idPadre !== null && ! $this->unidadPadreValido($idPadre, $id)) {
                return ApiResponse::error('La unidad padre no es válida.', 422);
            }
            $d['id_padre'] = $idPadre;
        }

        if (array_key_exists('activo', $d)) {
            $d['activo'] = (int) (bool) $d['activo'];
        }

        db_connect()->table('permiso_unidad_organica')->where('id_unidad', $id)->update($d);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Unidad actualizada.']);
    }

    private function unidadPadreValido(int $idPadre, ?int $idUnidad): bool
    {
        $db = db_connect();
        $visitados = [];
        $actual = $idPadre;

        while ($actual !== null) {
            if ($idUnidad !== null && $actual === $idUnidad) return false;
            if (isset($visitados[$actual])) return false;
            $visitados[$actual] = true;

            $row = $db->table('permiso_unidad_organica')
                ->select('id_padre')
                ->where('id_unidad', $actual)
                ->get()->getRowArray();
            if (! $row) return false;
            $actual = $row['id_padre'] !== null ? (int) $row['id_padre'] : null;
        }

        return true;
    }

    // ----- Puestos -----
    public function listarPuestos()
    {
        return ApiResponse::ok(db_connect()->table('permiso_puesto_control')->orderBy('nombre')->get()->getResultArray());
    }

    public function crearPuesto()
    {
        $db = db_connect();
        $db->table('permiso_puesto_control')->insert($this->datos());
        return ApiResponse::ok(['id_puesto' => (int) $db->insertID()], 201);
    }

    public function actualizarPuesto(int $id)
    {
        $d = $this->datos();
        if ($d === []) return ApiResponse::error('Datos inválidos.', 422);
        db_connect()->table('permiso_puesto_control')->where('id_puesto', $id)->update($d);
        return ApiResponse::ok(null, 200, ['mensaje' => 'Puesto actualizado.']);
    }

    // ----- Cargos -----
    public function listarCargos()
    {
        return ApiResponse::ok(
            db_connect()->table('permiso_cargo')->orderBy('nombre')->get()->getResultArray()
        );
    }

    public function crearCargo()
    {
        $d = $this->datos();
        $nombre = trim((string) ($d['nombre'] ?? ''));
        if ($nombre === '') return ApiResponse::error('El nombre del cargo es obligatorio.', 422);

        $existe = db_connect()->table('permiso_cargo')->where('nombre', $nombre)->countAllResults();
        if ($existe > 0) return ApiResponse::error('El cargo ya existe.', 409);

        $db = db_connect();
        $db->table('permiso_cargo')->insert([
            'nombre' => $nombre,
            'activo' => isset($d['activo']) ? (int) (bool) $d['activo'] : 1,
        ]);
        return ApiResponse::ok(['id_cargo' => (int) $db->insertID()], 201);
    }

    public function actualizarCargo(int $id)
    {
        $d = $this->datos();
        if ($d === []) return ApiResponse::error('Datos inválidos.', 422);
        $update = [];
        if (array_key_exists('nombre', $d)) {
            $nombre = trim((string) $d['nombre']);
            if ($nombre === '') return ApiResponse::error('El nombre del cargo es obligatorio.', 422);
            $existe = db_connect()->table('permiso_cargo')
                ->where('nombre', $nombre)
                ->where('id_cargo !=', $id)
                ->countAllResults();
            if ($existe > 0) return ApiResponse::error('El cargo ya existe.', 409);
            $update['nombre'] = $nombre;
        }
        if (array_key_exists('activo', $d)) {
            $update['activo'] = (int) (bool) $d['activo'];
        }
        if ($update !== []) {
            db_connect()->table('permiso_cargo')->where('id_cargo', $id)->update($update);
        }
        return ApiResponse::ok(null, 200, ['mensaje' => 'Cargo actualizado.']);
    }

    // ----- Configuración -----
    public function listarConfiguracion()
    {
        return ApiResponse::ok(
            db_connect()->table('permiso_configuracion')->orderBy('clave')->get()->getResultArray()
        );
    }

    public function actualizarConfiguracion()
    {
        $d = $this->datos();

        $permitidas = [
            'hora_corte_jornada' => 'Hora oficial de fin de jornada para alertas de no retorno',
            'lugar_expedicion' => 'Lugar de expedición que se imprime en la papeleta',
            'dias_justificacion_abandono' => 'Días hábiles para justificar un abandono de centro de labores',
            'dias_justificacion_enfermedad' => 'Días hábiles para presentar el sustento de enfermedad (CITT)',
        ];

        $valores = [];
        if (array_key_exists('hora_corte_jornada', $d)) {
            $hora = (string) $d['hora_corte_jornada'];
            if (! preg_match('/^\d{2}:\d{2}$/', $hora)) {
                return ApiResponse::error('La hora de corte debe tener formato HH:MM.', 422);
            }
            [$hh, $mm] = array_map('intval', explode(':', $hora));
            if ($hh > 23 || $mm > 59) {
                return ApiResponse::error('La hora de corte no es válida.', 422);
            }
            $valores['hora_corte_jornada'] = $hora;
        }

        if (array_key_exists('lugar_expedicion', $d)) {
            $lugar = trim((string) $d['lugar_expedicion']);
            if ($lugar === '' || mb_strlen($lugar) > 150) {
                return ApiResponse::error('El lugar de expedición es obligatorio y no debe superar 150 caracteres.', 422);
            }
            $valores['lugar_expedicion'] = $lugar;
        }

        foreach (['dias_justificacion_abandono', 'dias_justificacion_enfermedad'] as $clave) {
            if (! array_key_exists($clave, $d)) continue;
            $valor = $d[$clave];
            if (! is_numeric($valor) || (int) $valor < 0 || (int) $valor > 30) {
                return ApiResponse::error('Los días de justificación deben ser un entero entre 0 y 30.', 422);
            }
            $valores[$clave] = (string) (int) $valor;
        }

        $db = db_connect();
        foreach ($valores as $clave => $valor) {
            $existe = $db->table('permiso_configuracion')->where('clave', $clave)->countAllResults();
            if ($existe) {
                $db->table('permiso_configuracion')->where('clave', $clave)->update(['valor' => $valor]);
            } else {
                $db->table('permiso_configuracion')->insert([
                    'clave'       => $clave,
                    'valor'       => $valor,
                    'descripcion' => $permitidas[$clave],
                ]);
            }
        }

        return ApiResponse::ok(null, 200, ['mensaje' => 'Configuración actualizada.']);
    }

    private function servidorOcupado(?int $idServidor, ?int $idUsuarioExcluir = null): bool
    {
        if (empty($idServidor)) return false;

        $q = db_connect()->table('permiso_usuario')->where('id_servidor', $idServidor);
        if ($idUsuarioExcluir !== null) {
            $q->where('id_usuario !=', $idUsuarioExcluir);
        }
        return $q->countAllResults() > 0;
    }

    private function asignarRolesA(int $idUsuario, array $roles): void
    {
        $db = db_connect();
        $db->table('permiso_usuario_rol')->where('id_usuario', $idUsuario)->delete();
        $idsRoles = $db->table('permiso_rol')->whereIn('nombre', $roles)->get()->getResultArray();
        foreach ($idsRoles as $r) {
            $db->table('permiso_usuario_rol')->insert([
                'id_usuario' => $idUsuario, 'id_rol' => $r['id_rol'],
            ]);
        }
    }
}