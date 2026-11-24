<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class CerrarSinRetorno extends BaseCommand
{
    protected $group       = 'permisos';
    protected $name        = 'permisos:cerrar-sin-retorno';
    protected $description = 'Cierra los permisos sin retorno cuando finaliza la jornada laboral.';
    protected $usage       = 'permisos:cerrar-sin-retorno';

    public function run(array $params)
    {
        $cerradas = (new \App\Services\MarcacionService())->cerrarSinRetornoVencidas();
        CLI::write('Permisos cerrados automáticamente: ' . $cerradas, 'green');
    }
}
