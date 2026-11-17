<?php

namespace App\Controllers\Api;

use App\Libraries\ApiResponse;
use App\Models\SaldoModel;

class SaldosController extends BaseApiController
{
    public function mios()
    {
        $anio = (int) ($this->request->getGet('anio') ?? date('Y'));
        return ApiResponse::ok((new SaldoModel())->delServidor((int) $this->idServidor(), $anio));
    }

    public function mensuales()
    {
        $anio = (int) ($this->request->getGet('anio') ?? date('Y'));
        $mes  = (int) ($this->request->getGet('mes') ?? date('n'));

        if ($mes < 1 || $mes > 12) $mes = (int) date('n');

        return ApiResponse::ok(
            (new SaldoModel())->mensualesDelServidor((int) $this->idServidor(), $anio, $mes)
        );
    }
}