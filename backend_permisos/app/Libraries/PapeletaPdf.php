<?php

namespace App\Libraries;

use Dompdf\Dompdf;
use Dompdf\Options;

class PapeletaPdf
{
    public function generar(int $idSolicitud): ?string
    {
        $db = db_connect();
        $s = $db->table('permiso_solicitud_papeleta s')
            ->select('s.*, t.nombre AS tipo_nombre, t.categoria,
                      CONCAT(sv.apellidos, ", ", sv.nombres) AS servidor,
                      sv.dni, c.nombre AS cargo, u.nombre AS unidad')
            ->join('permiso_tipo_solicitud t', 't.id_tipo = s.id_tipo')
            ->join('permiso_servidor sv', 'sv.id_servidor = s.id_servidor')
            ->join('permiso_cargo c', 'c.id_cargo = COALESCE(s.id_cargo_solicitud, sv.id_cargo)', 'left')
            ->join('permiso_unidad_organica u', 'u.id_unidad = COALESCE(s.id_unidad_solicitud, sv.id_unidad)')
            ->where('s.id_solicitud', $idSolicitud)->get()->getRowArray();

        if (! $s) return null;
        if (empty($s['token_codigo'])) return null;

        $barcode = $this->barcodeHtml($s['token_codigo']);
        $esEmergencia = (int) $s['es_urgente'] === 1;
        $sello = $esEmergencia
            ? '<div class="sello">SALIDA DE EMERGENCIA<br>POR REGULARIZAR</div>'
            : '';

        $html = view('papeleta/pdf', [
            's' => $s, 'barcode' => $barcode, 'sello' => $sello,
        ]);

        $opts = new Options();
        $opts->set('isRemoteEnabled', true);
        $dompdf = new Dompdf($opts);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return $dompdf->output();
    }

    private function barcodeHtml(string $code): string
    {
        if (class_exists(\Picqer\Barcode\BarcodeGeneratorPNG::class)) {
            $png = (new \Picqer\Barcode\BarcodeGeneratorPNG())
                ->getBarcode($code, \Picqer\Barcode\BarcodeGeneratorPNG::TYPE_CODE_128, 1.5, 60);
            return '<img src="data:image/png;base64,' . base64_encode($png) . '" alt="barcode">';
        }

        return '<div style="font-family:monospace;font-size:16px;letter-spacing:6px;text-align:center;">'
             . htmlspecialchars($code) . '</div>';
    }
}