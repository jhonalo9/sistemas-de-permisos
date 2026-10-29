<?php

namespace Config;

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', static fn () => service('response')
    ->setJSON(['ok' => true, 'servicio' => 'Sistema de Permisos y Licencias']));

$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($r) {

    // ---- Público ----
    $r->post('auth/login', 'AuthController::login');
    $r->options('(:any)', static fn () => service('response')->setStatusCode(204));

    // ---- Autenticado ----
    $r->group('', ['filter' => 'jwt'], static function ($r) {

        $r->get('auth/me', 'AuthController::me');
        $r->post('auth/logout', 'AuthController::logout');

        // Catálogos consultables por cualquier autenticado
        $r->get('catalogos/tipos', 'AdminController::listarTipos');
        $r->get('catalogos/unidades', 'AdminController::listarUnidades');

        // ---- SERVIDOR ----
        $r->group('solicitudes', ['filter' => 'role:SERVIDOR,ADMIN'], static function ($r) {
            $r->get('',       'SolicitudesController::index');
            $r->post('',      'SolicitudesController::crear');
            $r->get('(:num)', 'SolicitudesController::detalle/$1');
            $r->get('(:num)/codigo-barras', 'SolicitudesController::codigoBarras/$1');
            $r->post('(:num)/borrador', 'SolicitudesController::actualizarBorrador/$1');
            $r->post('(:num)/enviar', 'SolicitudesController::enviarBorrador/$1');
            $r->post('(:num)/anular', 'SolicitudesController::anular/$1');
            $r->post('(:num)/corregir', 'SolicitudesController::corregir/$1');
            $r->get('(:num)/adjuntos/(:num)', 'AdjuntosController::descargar/$1/$2');
        });

        $r->get('saldos/mios', 'SaldosController::mios', ['filter' => 'role:SERVIDOR,ADMIN']);

        $r->group('regularizaciones', ['filter' => 'role:SERVIDOR,RRHH,ADMIN'], static function ($r) {
            $r->get('',           'SolicitudesController::regularizacionesPendientes');
            $r->get('historial',  'SolicitudesController::regularizacionesHistorial');
            $r->post('(:num)/completar', 'SolicitudesController::completarRegularizacion/$1');
        });

        // ---- JEFE ----
        $r->group('aprobaciones', ['filter' => 'role:JEFE,ADMIN'], static function ($r) {
            $r->get('pendientes',      'AprobacionesController::pendientes');
            $r->get('(:num)',          'AprobacionesController::detalle/$1');
            $r->post('(:num)/aprobar', 'AprobacionesController::aprobar/$1');
            $r->post('(:num)/observar', 'AprobacionesController::observar/$1');
            $r->post('(:num)/rechazar', 'AprobacionesController::rechazar/$1');
            $r->get('equipo',           'AprobacionesController::miEquipo');
        });

        // ---- RRHH ----
        $r->group('rrhh', ['filter' => 'role:RRHH,ADMIN'], static function ($r) {
            $r->get('panel',              'RrhhController::panel');
            $r->get('bandeja',            'RrhhController::bandeja');
            $r->get('(:num)',             'RrhhController::detalle/$1');
            $r->post('(:num)/validar',    'RrhhController::validar/$1');
            $r->post('(:num)/observar',   'RrhhController::observar/$1');
            $r->post('(:num)/rechazar',   'RrhhController::rechazar/$1');
            $r->post('(:num)/token',      'RrhhController::generarToken/$1');
            $r->get('(:num)/papeleta.pdf', 'RrhhController::papeletaPdf/$1');
            $r->get('regularizaciones',   'RrhhController::regularizaciones');
            $r->get('reportes/ausentismo', 'ReportesController::ausentismo');
            $r->get('reportes/descuentos', 'ReportesController::descuentos');
            $r->get('reportes/licencias',  'ReportesController::licencias');
            $r->get('reportes/saldos',     'ReportesController::saldos');
            $r->get('reportes/exportar',   'ReportesController::exportar');
        });

        // ---- CONTROL ----
        $r->group('marcaciones', ['filter' => 'role:CONTROL,RRHH,ADMIN'], static function ($r) {
            $r->post('registrar',    'MarcacionesController::registrar');
            $r->post('manual',       'MarcacionesController::manual');
            $r->post('emergencia',   'MarcacionesController::emergencia');
            $r->get('emergencias',   'MarcacionesController::emergencias');
            $r->get('fuera',         'MarcacionesController::fueraAhora');
            $r->get('no-volvieron',  'MarcacionesController::noVolvieron');
            $r->get('buscar-servidor', 'MarcacionesController::buscarServidor');
        });

        // ---- ADMIN ----
        $r->group('admin', ['filter' => 'role:ADMIN'], static function ($r) {
            // Tipos
            $r->get('tipos',            'AdminController::listarTipos');
            $r->post('tipos',           'AdminController::crearTipo');
            $r->put('tipos/(:num)',     'AdminController::actualizarTipo/$1');

            // Usuarios
            $r->get('usuarios',         'AdminController::listarUsuarios');
            $r->post('usuarios',        'AdminController::crearUsuario');
            $r->put('usuarios/(:num)',  'AdminController::actualizarUsuario/$1');
            $r->post('usuarios/(:num)/roles', 'AdminController::asignarRoles/$1');

            // Feriados
            $r->get('feriados',         'AdminController::listarFeriados');
            $r->post('feriados',        'AdminController::crearFeriado');
            $r->delete('feriados/(:num)', 'AdminController::eliminarFeriado/$1');

            // Unidades
            $r->get('unidades',         'AdminController::listarUnidades');
            $r->post('unidades',        'AdminController::crearUnidad');
            $r->put('unidades/(:num)',  'AdminController::actualizarUnidad/$1');

            // Puestos de control
            $r->get('puestos',          'AdminController::listarPuestos');
            $r->post('puestos',         'AdminController::crearPuesto');
            $r->put('puestos/(:num)',   'AdminController::actualizarPuesto/$1');

            // Cargos
            $r->get('cargos',           'AdminController::listarCargos');
            $r->post('cargos',          'AdminController::crearCargo');
            $r->put('cargos/(:num)',    'AdminController::actualizarCargo/$1');

            // Servidores
            $r->get('servidores',       'ServidoresController::index');
            $r->post('servidores',      'ServidoresController::crear');
            $r->put('servidores/(:num)', 'ServidoresController::actualizar/$1');

            // Configuración
            $r->get('configuracion',    'AdminController::listarConfiguracion');
            $r->put('configuracion',    'AdminController::actualizarConfiguracion');
        });
    });
});
