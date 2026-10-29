<?php
/**
 * @var array  $s
 * @var string $barcode
 * @var string $sello
 */
$copias = ['ORIGINAL', 'COPIA'];
?>

<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color:#1A2433; }
  .copia { position: relative; }
  .etiqueta { text-align:right; font-size:9px; font-weight:bold; color:#1F4E8C; letter-spacing:1px; margin-bottom:4px; }
  .head { text-align:center; border-bottom:2px solid #1F4E8C; padding-bottom:8px; margin-bottom:12px; }
  .head h1 { font-size: 14px; margin:0; }
  .head h2 { font-size: 12px; margin:4px 0 0; }
  .head h3 { font-size: 11px; margin:6px 0 0; text-transform: uppercase; }
  .grid { width:100%; border-collapse:collapse; }
  .grid td { padding:6px 4px; vertical-align:top; }
  .lbl { font-size:9px; color:#555; text-transform:uppercase; }
  .val { font-size:12px; font-weight:bold; border-bottom:1px solid #999; min-height:18px; display:block; }
  .firmas { margin-top:24px; width:100%; border-collapse:collapse; }
  .firmas td { border:1px solid #1F4E8C; height:60px; text-align:center; font-size:10px; padding:4px; }
  .sello { position:absolute; top:25%; left:18%; transform:rotate(-30deg);
    font-size:38px; color:rgba(220,38,38,0.25); font-weight:bold; text-align:center;
    border:6px solid rgba(220,38,38,0.3); padding:16px 32px; }
  .nota { font-size:9px; margin-top:14px; color:#333; }
  .topbar { width:100%; border-collapse:collapse; margin-bottom:6px; }
  .topbar td { vertical-align:top; }
  .topbar .barcode-cell { width:60%; text-align:left; }
  .topbar .nro { width:40%; text-align:right; }
  .nro .n { font-size:14px; font-weight:bold; color:#1F4E8C; }
  .barcode img { width: 180px; height: 50px; }
</style></head><body>

<?php foreach ($copias as $indice => $copia): ?>
  <div class="copia" <?= $indice > 0 ? 'style="page-break-before: always;"' : '' ?>>
    <table class="topbar">
      <tr>
        <td class="barcode-cell">
          <div class="barcode"><?= $barcode ?></div>
        </td>
        <td class="nro">
          <div class="etiqueta"><?= $copia ?></div>
          <div class="lbl">N.º</div>
          <div class="n"><?= esc($s['nro_solicitud']) ?></div>
        </td>
      </tr>
    </table>

    <div class="head">
      <h1>MUNICIPALIDAD DISTRITAL DE JOSÉ LEONARDO ORTIZ</h1>
      <h2>OFICINA DE GESTIÓN DE RECURSOS HUMANOS</h2>
      <h3>Papeleta de salida y retorno de personal · Año <?= date('Y', strtotime($s['fecha_inicio'])) ?></h3>
    </div>

    <?= $sello ?>

    <table class="grid">
      <tr>
        <td style="width:60%"><span class="lbl">Apellidos y nombres</span><span class="val"><?= esc($s['servidor']) ?></span></td>
        <td style="width:40%"><span class="lbl">DNI</span><span class="val"><?= esc($s['dni']) ?></span></td>
      </tr>
      <tr>
        <td><span class="lbl">Unidad orgánica</span><span class="val"><?= esc($s['unidad']) ?></span></td>
        <td><span class="lbl">Cargo</span><span class="val"><?= esc($s['cargo'] ?? '—') ?></span></td>
      </tr>
      <tr>
        <td colspan="2"><span class="lbl">Motivo de salida</span><span class="val"><?= esc($s['motivo']) ?></span></td>
      </tr>
      <tr>
        <td colspan="2"><span class="lbl">Lugar de comisión</span><span class="val">&nbsp;</span></td>
      </tr>
      <tr>
        <td><span class="lbl">Hora de salida</span><span class="val"><?= esc($s['hora_inicio'] ?? '—') ?></span></td>
        <td><span class="lbl">Hora de retorno</span><span class="val"><?= esc($s['hora_fin'] ?? '—') ?></span></td>
      </tr>
      <tr>
        <td><span class="lbl">Tiempo empleado</span><span class="val"><?= $s['tiempo_empleado_min'] !== null ? esc($s['tiempo_empleado_min']) . ' min' : '&nbsp;' ?></span></td>
        <td><span class="lbl">Funcionario que autoriza</span><span class="val">&nbsp;</span></td>
      </tr>
    </table>

    <table class="firmas">
      <tr>
        <td>Fecha</td>
        <td>Control de personal</td>
        <td>Jefe inmediato</td>
        <td>V.° B.° G.G.R.H.</td>
        <td>Firma entidad de destino</td>
      </tr>
    </table>

    <p class="nota">
      Esta papeleta debe ser llenada por duplicado; la copia deberá ser entregada al retorno,
      debidamente visada por el jefe inmediato, bajo responsabilidad, indicando el nombre y apellido legible.
    </p>
  </div>
<?php endforeach; ?>
</body></html>
