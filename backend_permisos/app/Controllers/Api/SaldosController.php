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
}