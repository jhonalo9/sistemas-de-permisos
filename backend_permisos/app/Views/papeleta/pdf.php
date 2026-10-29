<?php
/**
 * @var array  $s
 * @var string $barcode
 * @var string $sello
 * @var string $logo
 */
$copias = ['ORIGINAL', 'COPIA'];
$anio = date('Y', strtotime($s['fecha_inicio']));
$horaSalida = ! empty($s['hora_inicio']) ? substr((string) $s['hora_inicio'], 0, 5) : '';
$horaRetorno = ! empty($s['hora_fin']) ? substr((string) $s['hora_fin'], 0, 5) : '';

$minutos = null;
if ($s['tiempo_empleado_min'] !== null && (float) $s['tiempo_empleado_min'] > 0) {
    $minutos = (float) $s['tiempo_empleado_min'];
} elseif ($horaSalida !== '' && $horaRetorno !== '') {
    [$hi, $mi] = array_map('intval', explode(':', $horaSalida));
    [$hf, $mf] = array_map('intval', explode(':', $horaRetorno));
    $minutos = ($hf * 60 + $mf) - ($hi * 60 + $mi);
    if ($minutos < 0) {
        $minutos += 24 * 60;
    }
}

$tiempo = '';
if ($minutos !== null && $minutos > 0) {
    $minutos = (int) round($minutos);
    $horas = intdiv($minutos, 60);
    $resto = $minutos % 60;
    if ($horas > 0 && $resto > 0) {
        $tiempo = $horas . ' h ' . $resto . ' min';
    } elseif ($horas > 0) {
        $tiempo = $horas . ' h';
    } else {
        $tiempo = $resto . ' min';
    }
}
?>
<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { margin: 18px 22px; }
  * { box-sizing: border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color:#111; margin:0; }
  .copia { position: relative; page-break-inside: avoid; }
  .separador { border-top: 1.5px dashed #555; margin: 10px 0 12px; }
  .topline { width:100%; border-collapse:collapse; margin-bottom:5px; }
  .topline td { vertical-align:top; padding:0; }
  .barcode { text-align:left; }
  .barcode img { width: 170px; height: 46px; }
  .topright { text-align:right; }
  .copy { font-size:9px; font-weight:bold; color:#1F4E8C; letter-spacing:1px; }
  .nro { font-size:9px; font-weight:bold; color:#1F4E8C; margin-top:2px; }

  .form { width:100%; border-collapse:collapse; table-layout:fixed; margin:0; }
  .form td { border:1px solid #000; padding:3px 4px; vertical-align:middle; line-height:1.25; }
  .head-table td { text-align:center; }
  .logo-cell { vertical-align:middle !important; text-align:center; padding:2px !important; }
  .logo-cell img { height:68px; width:auto; }
  .title { font-size:11px; font-weight:bold; color:#1F4E8C; text-transform:uppercase; }
  .office { font-size:10px; font-weight:bold; color:#1F4E8C; text-transform:uppercase; }
  .papeleta { font-size:10px; font-weight:bold; color:#1F4E8C; text-transform:uppercase; }
  .year-label { font-size:9px; font-weight:bold; text-transform:uppercase; }
  .year-value { font-size:10px; font-weight:bold; }
  .blank { }

  .fields tr:first-child td { border-top:0; }
  .label { font-size:8.5px; font-weight:bold; text-transform:uppercase; }
  .value { font-size:10px; font-weight:bold; }
  .red { color:#C00000; }

  .signatures tr:first-child td { border-top:0; }
  .signatures td { height:64px; vertical-align:bottom; text-align:center; font-size:8px; font-weight:bold; text-transform:uppercase; }
  .note-table td { border-top:0; font-size:8px; line-height:1.35; text-align:justify; text-transform:uppercase; }
  .sello { position:absolute; top:34%; left:20%; transform:rotate(-30deg);
    font-size:34px; color:rgba(220,38,38,0.22); font-weight:bold; text-align:center;
    border:5px solid rgba(220,38,38,0.28); padding:14px 26px; }
</style></head><body>

<?php foreach ($copias as $indice => $copia): ?>
  <?php if ($indice > 0): ?><div class="separador"></div><?php endif; ?>
  <div class="copia">
    <table class="topline">
      <tr>
        <td style="width:62%;"><div class="barcode"><?= $barcode ?></div></td>
        <td class="topright" style="width:38%;">
          <div class="copy"><?= $copia ?></div>
          <div class="nro">N.º <?= esc($s['nro_solicitud']) ?></div>
        </td>
      </tr>
    </table>

    <table class="form head-table">
      <colgroup>
        <col style="width:14%;">
        <col style="width:56%;">
        <col style="width:10%;">
        <col style="width:20%;">
      </colgroup>
      <tr>
        <td rowspan="3" class="logo-cell" style="width:14%;">
          <?php if (! empty($logo)): ?><img src="<?= $logo ?>" alt="Escudo"><?php endif; ?>
        </td>
        <td class="title" style="width:56%;">MUNICIPALIDAD DISTRITAL DE JOSÉ LEONARDO ORTIZ</td>
        <td class="year-label" style="width:10%;">AÑO</td>
        <td class="year-value" style="width:20%;"><?= esc($anio) ?></td>
      </tr>
      <tr>
        <td class="office" style="width:56%;">OFICINA DE GESTIÓN DE RECURSOS HUMANOS</td>
        <td colspan="2" class="blank">&nbsp;</td>
      </tr>
      <tr>
        <td class="papeleta" style="width:56%;">PAPELETA DE SALIDA Y RETORNO DE PERSONAL</td>
        <td colspan="2" class="blank">&nbsp;</td>
      </tr>
    </table>

    <table class="form fields">
      <colgroup>
        <col style="width:55%;">
        <col style="width:20%;">
        <col style="width:25%;">
      </colgroup>
      <tr>
        <td style="width:55%;">
          <span class="label">APELLIDOS Y NOMBRES :</span>
          <span class="value"><?= esc($s['servidor']) ?></span>
        </td>
        <td colspan="2" style="width:45%;"><span class="label">FIRMA :</span></td>
      </tr>
      <tr>
        <td style="width:55%;">
          <span class="label">UNIDAD ORGÁNICA :</span>
          <span class="value"><?= esc($s['unidad']) ?></span>
        </td>
        <td colspan="2" style="width:45%;">
          <span class="label">CARGO :</span>
          <span class="value"><?= esc($s['cargo'] ?? '') ?></span>
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <span class="label">MOTIVO DE SALIDA :</span>
          <span class="value"><?= esc($s['motivo']) ?></span>
        </td>
      </tr>
      <tr>
        <td colspan="3"><span class="label">LUGAR DE COMISIÓN :</span></td>
      </tr>
      <tr>
        <td style="width:55%;"><span class="label">NOMBRE DEL FUNCIONARIO :</span></td>
        <td style="width:20%;"><span class="label red">HORA DE SALIDA :</span> <span class="value"><?= esc($horaSalida) ?></span></td>
        <td style="width:25%;"><span class="label red">HORA DE RETORNO :</span> <span class="value"><?= esc($horaRetorno) ?></span></td>
      </tr>
      <tr>
        <td colspan="3"><span class="label">TIEMPO EMPLEADO :</span> <span class="value"><?= $tiempo ?></span></td>
      </tr>
    </table>

    <table class="form signatures">
      <tr>
        <td style="width:18%;">FECHA</td>
        <td style="width:18%;">CONTROL DE PERSONAL</td>
        <td style="width:20%;">JEFE INMEDIATO</td>
        <td style="width:18%;">V.° B.° G.G.R.H.</td>
        <td style="width:26%;">FIRMA DE LA ENTIDAD DE DESTINO</td>
      </tr>
    </table>

    <table class="form note-table">
      <tr>
        <td>
          <strong>NOTA:</strong> ESTA PAPELETA DEBE SER LLENADO POR DUPLICADO, LA COPIA DEBERÁ SER
          ENTREGADA AL RETORNO, DEBIDAMENTE VISADA POR EL JEFE QUE ACREDITE LA MISIÓN CUMPLIDA,
          BAJO RESPONSABILIDAD, INDICANDO EL <strong>NOMBRE Y APELLIDO LEGIBLE</strong>.
        </td>
      </tr>
    </table>

    <?= $sello ?>
  </div>
<?php endforeach; ?>
</body></html>
