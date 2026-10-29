<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\SolicitudModel;
use App\Services\SolicitudService;
use App\Services\RegularizacionService;
use App\Models\TipoSolicitudModel;

class SolicitudesController extends BaseApiController
{
    public function index()
    {
        $filtros = [
            'estado' => $this->request->getGet('estado'),
            'anio'   => $this->request->getGet('anio'),
        ];
        $p   = $this->paginar();
        $res = (new SolicitudModel())->porServidor((int) $this->idServidor(), $filtros, $p['offset'], $p['per_page']);
        return ApiResponse::ok($res['items'], 200, [
            'total' => $res['total'], 'page' => $p['page'], 'per_page' => $p['per_page'],
        ]);
    }

    public function crear()
    {
        if ($this->idServidor() === null) {
            return ApiResponse::error('El usuario autenticado no tiene un servidor asociado.', 422);
        }

        $datos = $this->datos();
        $esBorrador = ! empty($datos['borrador']);
        $idTipo = (int) ($datos['id_tipo'] ?? 0);

        if ($idTipo <= 0) {
            return ApiResponse::error('Seleccione el tipo de solicitud.', 422);
        }

        $tipo = (new TipoSolicitudModel())->find($idTipo);
        if (! $tipo || ! $tipo['activo']) {
            return ApiResponse::error('Tipo de solicitud no válido.', 422);
        }
        if ($tipo['codigo'] === 'PER_EMERGENCIA') {
            return ApiResponse::error('La salida de emergencia se registra desde Control de Personal.', 422);
        }

        if ($esBorrador) {
            $cantidad = 0;
            if (! empty($datos['fecha_inicio']) && ! empty($datos['fecha_fin'])) {
                if (! $this->fechasValidas($datos)) {
                    return ApiResponse::error('Las fechas del borrador no son válidas.', 422);
                }
                $cantidad = $this->calcularCantidad($tipo, $datos);
            }
            $datos['cantidad'] = $cantidad;
            $lista = $this->archivosSubidos();

            try {
                $detalle = (new SolicitudService())->crear(
                    $datos,
                    (int) $this->idServidor(),
                    $this->idUsuario(),
                    $lista
                );
                return ApiResponse::ok($detalle, 201);
            } catch (\RuntimeException $e) {
                return ApiResponse::error($e->getMessage(), 422);
            } catch (\Throwable $e) {
                return ApiResponse::error('No se pudo crear el borrador: ' . $e->getMessage(), 500);
            }
        }

        $errores = \App\Libraries\Validador::validar($this->request, [
            'id_tipo'      => 'required|integer',
            'fecha_inicio' => 'required|valid_date[Y-m-d]',
            'fecha_fin'    => 'required|valid_date[Y-m-d]',
            'motivo'       => 'required|min_length[5]',
        ]);
        if ($errores) {
            return ApiResponse::error('Datos inválidos: ' . implode(' ', $errores), 422);
        }
        if (! $this->fechasValidas($datos)) {
            return ApiResponse::error('Las fechas de la solicitud no son válidas.', 422);
        }

        $cantidad = $this->calcularCantidad($tipo, $datos);
        if ($cantidad <= 0) {
            return ApiResponse::error('La cantidad calculada es 0. Verifique fechas y horas.', 422);
        }

        $lista = $this->archivosSubidos();
        if (! empty($tipo['requiere_sustento']) && empty($lista)) {
            return ApiResponse::error('Debe adjuntar el documento de sustento.', 422);
        }

        $datos['cantidad'] = $cantidad;

        try {
            $detalle = (new SolicitudService())->crear(
                $datos,
                (int) $this->idServidor(),
                $this->idUsuario(),
                $lista
            );
            return ApiResponse::ok($detalle, 201);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return ApiResponse::error('No se pudo crear la solicitud: ' . $e->getMessage(), 500);
        }
    }

    public function actualizarBorrador(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ((int) $s['id_servidor'] !== (int) $this->idServidor()) {
            return ApiResponse::error('No autorizado.', 403);
        }
        if ($s['estado'] !== 'BORRADOR') {
            return ApiResponse::error('Solo se puede editar un borrador.', 422);
        }

        $datos = $this->datos();
        $idTipo = (int) ($datos['id_tipo'] ?? $s['id_tipo']);
        $tipo = (new TipoSolicitudModel())->find($idTipo);
        if (! $tipo || ! $tipo['activo']) {
            return ApiResponse::error('Tipo de solicitud no válido.', 422);
        }
        if ($tipo['codigo'] === 'PER_EMERGENCIA') {
            return ApiResponse::error('La salida de emergencia se registra desde Control de Personal.', 422);
        }

        $merged = array_merge($s, $datos, ['id_tipo' => $idTipo]);
        if (($datos['fecha_inicio'] ?? $s['fecha_inicio']) && ($datos['fecha_fin'] ?? $s['fecha_fin'])) {
            if (! $this->fechasValidas($merged)) {
                return ApiResponse::error('Las fechas del borrador no son válidas.', 422);
            }
            $datos['cantidad'] = $this->calcularCantidad($tipo, $merged);
        } else {
            $datos['cantidad'] = 0;
        }

        try {
            $detalle = (new SolicitudService())->actualizarBorrador(
                $id,
                $datos,
                $this->archivosSubidos()
            );
            return ApiResponse::ok($detalle);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return ApiResponse::error('No se pudo actualizar el borrador: ' . $e->getMessage(), 500);
        }
    }

    public function enviarBorrador(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ((int) $s['id_servidor'] !== (int) $this->idServidor()) {
            return ApiResponse::error('No autorizado.', 403);
        }
        if ($s['estado'] !== 'BORRADOR') {
            return ApiResponse::error('La solicitud no es un borrador.', 422);
        }

        $datos = $this->datos();
        $idTipo = (int) ($datos['id_tipo'] ?? $s['id_tipo']);
        $tipo = (new TipoSolicitudModel())->find($idTipo);
        if (! $tipo || ! $tipo['activo']) {
            return ApiResponse::error('Tipo de solicitud no válido.', 422);
        }
        if ($tipo['codigo'] === 'PER_EMERGENCIA') {
            return ApiResponse::error('La salida de emergencia se registra desde Control de Personal.', 422);
        }

        $merged = array_merge($s, $datos, ['id_tipo' => $idTipo]);
        if (! $this->fechasValidas($merged)) {
            return ApiResponse::error('Complete las fechas de la solicitud.', 422);
        }
        if (empty($merged['motivo']) || strlen(trim((string) $merged['motivo'])) < 5) {
            return ApiResponse::error('El motivo debe tener al menos 5 caracteres.', 422);
        }

        $datos['cantidad'] = $this->calcularCantidad($tipo, $merged);
        $lista = $this->archivosSubidos();

        try {
            $svc = new SolicitudService();
            $svc->actualizarBorrador($id, $datos, $lista);
            $detalle = $svc->enviarBorrador($id, $this->idUsuario());
            return ApiResponse::ok($detalle);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return ApiResponse::error('No se pudo enviar el borrador: ' . $e->getMessage(), 500);
        }
    }

    public function codigoBarras(int $id)
    {
        $s = (new SolicitudModel())->detalleCompleto($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if (! $this->puedeVer($s)) return ApiResponse::error('No autorizado.', 403);
        if (($s['tipo']['unidad_medida'] ?? null) !== 'HORAS') {
            return ApiResponse::error('Esta solicitud no usa código de barras.', 422);
        }
        if (empty($s['token_codigo'])) {
            return ApiResponse::error('El código de barras aún no fue generado.', 422);
        }
        if (! class_exists(\Picqer\Barcode\BarcodeGeneratorPNG::class)) {
            return ApiResponse::error('Generador de código de barras no disponible.', 500);
        }

        $generator = new \Picqer\Barcode\BarcodeGeneratorPNG();
        $png = $generator->getBarcode($s['token_codigo'], $generator::TYPE_CODE_128, 2, 80);

        return service('response')
            ->setHeader('Content-Type', 'image/png')
            ->setBody($png);
    }

    public function detalle(int $id)
    {
        $s = (new SolicitudModel())->detalleCompleto($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if (! $this->puedeVer($s)) return ApiResponse::error('No autorizado.', 403);
        return ApiResponse::ok($s);
    }

    public function anular(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ((int) $s['id_servidor'] !== (int) $this->idServidor() && ! $this->tieneRol('ADMIN')) {
            return ApiResponse::error('No autorizado.', 403);
        }
        if (! in_array($s['estado'], ['BORRADOR', 'PENDIENTE', 'OBSERVADA', 'APROBADA_JEFE'], true)) {
            return ApiResponse::error('No se puede anular en el estado actual.', 422);
        }
        $d = $this->datos();
        (new SolicitudService())->cambiarEstado($id, 'ANULADA', $this->idUsuario(), $d['motivo'] ?? 'Anulada por el servidor.');
        return ApiResponse::ok(null, 200, ['mensaje' => 'Solicitud anulada.']);
    }

    public function corregir(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if ((int) $s['id_servidor'] !== (int) $this->idServidor()) {
            return ApiResponse::error('No autorizado.', 403);
        }
        if ($s['estado'] !== 'OBSERVADA') {
            return ApiResponse::error('Solo se corrige una solicitud observada.', 422);
        }

        $d = $this->datos();
        $idTipo = (int) ($d['id_tipo'] ?? $s['id_tipo']);
        $tipo = (new TipoSolicitudModel())->find($idTipo);
        if (! $tipo || ! $tipo['activo']) {
            return ApiResponse::error('Tipo de solicitud no válido.', 422);
        }
        if ($tipo['codigo'] === 'PER_EMERGENCIA') {
            return ApiResponse::error('La salida de emergencia se registra desde Control de Personal.', 422);
        }

        $merged = array_merge($s, $d, ['id_tipo' => $idTipo]);
        if (! $this->fechasValidas($merged)) {
            return ApiResponse::error('Las fechas de la solicitud no son válidas.', 422);
        }
        if (empty($merged['motivo']) || strlen(trim((string) $merged['motivo'])) < 5) {
            return ApiResponse::error('El motivo debe tener al menos 5 caracteres.', 422);
        }

        $cantidad = $this->calcularCantidad($tipo, $merged);
        if ($cantidad <= 0) {
            return ApiResponse::error('La cantidad calculada es 0. Verifique fechas y horas.', 422);
        }

        $lista = $this->archivosSubidos();
        $svc = new SolicitudService();
        if (! empty($tipo['requiere_sustento']) && empty($lista) && $svc->contarAdjuntos($id) < 1) {
            return ApiResponse::error('Debe adjuntar el documento de sustento.', 422);
        }

        $db = db_connect();
        $db->transBegin();
        try {
            (new SolicitudModel())->update($id, [
                'id_tipo'      => $idTipo,
                'motivo'       => $merged['motivo'],
                'fecha_inicio' => $merged['fecha_inicio'],
                'fecha_fin'    => $merged['fecha_fin'],
                'hora_inicio'  => $merged['hora_inicio'] ?? null,
                'hora_fin'     => $merged['hora_fin'] ?? null,
                'cantidad'     => $cantidad,
                'estado'       => 'PENDIENTE',
            ]);
            $svc->insertarAdjuntos($id, $lista);
            (new \App\Models\HistorialModel())->insert([
                'id_solicitud' => $id,
                'estado_ant'   => 'OBSERVADA',
                'estado_new'   => 'PENDIENTE',
                'id_usuario'   => $this->idUsuario(),
                'comentario'   => 'Corregida por el servidor.',
            ]);
            $db->transCommit();
            return ApiResponse::ok((new SolicitudModel())->detalleCompleto($id), 200);
        } catch (\Throwable $e) {
            $db->transRollback();
            return ApiResponse::error('No se pudo corregir: ' . $e->getMessage(), 500);
        }
    }

    public function regularizacionesPendientes()
    {
        $db  = db_connect();
        $sql = 'SELECT * FROM vw_regularizaciones_pendientes';
        $params = [];

        if (! $this->tieneRol('RRHH', 'ADMIN')) {
            $sql .= ' WHERE id_servidor = ?';
            $params[] = (int) $this->idServidor();
        }

        $sql .= ' ORDER BY dias_restantes ASC';
        $rows = $db->query($sql, $params)->getResultArray();
        return ApiResponse::ok($rows);
    }

    public function regularizacionesHistorial()
    {
        $b = db_connect()->table('permiso_solicitud_papeleta s')
            ->select("s.id_solicitud, s.nro_solicitud, s.id_servidor,
                      s.fecha_inicio, s.hora_inicio, s.hora_fin, s.cantidad,
                      s.motivo, s.estado, s.fecha_limite_regularizacion,
                      s.actualizado_en,
                      t.nombre AS tipo_nombre, t.codigo AS tipo_codigo, t.unidad_medida,
                      u.nombre AS unidad")
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->where('s.es_urgente', 1)
            ->where('s.estado !=', 'REGULARIZAR')
            ->orderBy('s.actualizado_en', 'DESC')
            ->orderBy('s.fecha_inicio', 'DESC');

        if (! $this->tieneRol('RRHH', 'ADMIN')) {
            $b->where('s.id_servidor', (int) $this->idServidor());
        }

        return ApiResponse::ok($b->limit(200)->get()->getResultArray());
    }

    public function completarRegularizacion(int $id)
    {
        $s = (new SolicitudModel())->find($id);
        if (! $s) return ApiResponse::error('Solicitud no encontrada.', 404);
        if (! $this->tieneRol('RRHH', 'ADMIN') && (int) $s['id_servidor'] !== (int) $this->idServidor()) {
            return ApiResponse::error('No autorizado.', 403);
        }

        $d = $this->datos();
        try {
            (new RegularizacionService())->completar($id, $d, $this->idUsuario(), $this->archivosSubidos());
            return ApiResponse::ok(null, 200, ['mensaje' => 'Regularización completada.']);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return ApiResponse::error('No se pudo completar la regularización: ' . $e->getMessage(), 500);
        }
    }

    private function archivosSubidos(): array
    {
        $adjuntos = $this->request->getFileMultiple('adjuntos');
        if (empty($adjuntos)) {
            $single = $this->request->getFile('adjuntos');
            $adjuntos = ($single && $single->isValid()) ? [$single] : [];
        }
        if ($adjuntos instanceof \CodeIgniter\HTTP\Files\UploadedFile) {
            $adjuntos = [$adjuntos];
        }
        if (! is_array($adjuntos)) {
            $adjuntos = [];
        }
        return $this->procesarArchivos(array_values($adjuntos));
    }

    private function fechasValidas(array $d): bool
    {
        $inicio = $d['fecha_inicio'] ?? null;
        $fin = $d['fecha_fin'] ?? null;
        if (empty($inicio) || empty($fin)) return false;
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $inicio)) return false;
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $fin)) return false;
        return strtotime((string) $inicio) !== false && strtotime((string) $fin) !== false;
    }

    private function calcularCantidad(array $tipo, array $d): float
    {
        if ($tipo['unidad_medida'] === 'HORAS') {
            if (empty($d['hora_inicio']) || empty($d['hora_fin'])) return 0;
            $ini = strtotime('1970-01-01 ' . $d['hora_inicio']);
            $fin = strtotime('1970-01-01 ' . $d['hora_fin']);
            return max(0, round(($fin - $ini) / 3600, 2));
        }
        if (empty($d['fecha_inicio']) || empty($d['fecha_fin'])) return 0;

        $ini = strtotime((string) $d['fecha_inicio']);
        $fin = strtotime((string) $d['fecha_fin']);
        if ($ini === false || $fin === false) return 0;

        if ($tipo['dias_calendario']) {
            return max(0, (int) (($fin - $ini) / 86400) + 1);
        }

        $feriados = array_column(
            db_connect()->table('permiso_feriado')->get()->getResultArray(), 'fecha'
        );
        $n = 0;
        for ($t = $ini; $t <= $fin; $t += 86400) {
            $dow = (int) date('N', $t);
            if ($dow >= 6) continue;
            if (in_array(date('Y-m-d', $t), $feriados, true)) continue;
            $n++;
        }
        return $n;
    }

    private function procesarArchivos(array $files): array
    {
        $out = [];
        foreach ($files as $f) {
            if (! $f->isValid() || $f->hasMoved()) continue;
            $nuevo = $f->getRandomName();
            $f->move(WRITEPATH . 'uploads/adjuntos', $nuevo);
            $out[] = [
                'nombre'       => $f->getClientName(),
                'ruta'         => 'uploads/adjuntos/' . $nuevo,
                'mime'         => $f->getClientMimeType(),
                'tamano'       => $f->getSize(),
                'confidencial' => (bool) preg_match('/certificado|medic|salud/i', $f->getClientName()),
            ];
        }
        return $out;
    }

    private function puedeVer(array $s): bool
    {
        if ($this->tieneRol('RRHH', 'ADMIN')) return true;
        if ((int) $s['id_servidor'] === (int) $this->idServidor()) return true;

        if ($this->tieneRol('JEFE')) {
            $jefeId = $s['id_jefe_solicitud'] ?? null;
            if ($jefeId === null) {
                $sv = db_connect()->table('permiso_servidor')
                    ->where('id_servidor', $s['id_servidor'])
                    ->get()->getRowArray();
                $jefeId = $sv['id_jefe'] ?? null;
            }
            return $jefeId !== null && (int) $jefeId === (int) $this->idServidor();
        }

        return false;
    }
}
