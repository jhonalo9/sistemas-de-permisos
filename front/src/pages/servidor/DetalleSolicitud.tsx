import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, obtenerCodigoBarras } from '@/services/api';
import { Button, Badge, Card, ConfidentialBadge, Input, TextArea, TimelineItem, useToast } from '@/components/common';
import VistaPreviaAdjunto from '@/components/adjuntos/VistaPreviaAdjunto';
import { formatearFecha, categoriaLabel } from '@/utils/format';
import { Copy, FileText, Eye } from 'lucide-react';

export default function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = React.useState<any>(null);
  const [adjuntoVista, setAdjuntoVista] = React.useState<any | null>(null);
  const [showCorreccion, setShowCorreccion] = React.useState(false);
  const [correccion, setCorreccion] = React.useState({
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '',
    hora_fin: '',
    motivo: '',
  });
  const [showBarcode, setShowBarcode] = React.useState(false);
  const [barcodeUrl, setBarcodeUrl] = React.useState<string | null>(null);
  const [barcodeLoading, setBarcodeLoading] = React.useState(false);
  const [barcodeError, setBarcodeError] = React.useState<string | null>(null);

  const cargarDetalle = useCallback(async (idSolicitud: number) => {
    try {
      const res = await apiClient<any>(`/solicitudes/${idSolicitud}`);
      setSolicitud(res.data || null);
    } catch (e: any) {
      toast.error('Error al cargar detalle', e.mensaje);
    }
  }, []);

  React.useEffect(() => {
    if (id) cargarDetalle(Number(id));
  }, [id]); // mount/id

  const abrirCorreccion = () => {
    setCorreccion({
      fecha_inicio: solicitud.fecha_inicio || '',
      fecha_fin: solicitud.fecha_fin || '',
      hora_inicio: (solicitud.hora_inicio || '').slice(0, 5),
      hora_fin: (solicitud.hora_fin || '').slice(0, 5),
      motivo: solicitud.motivo || '',
    });
    setShowCorreccion(true);
  };

  const guardarCorreccion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/solicitudes/${id}/corregir`, { method: 'POST', body: correccion });
      toast.success('Solicitud corregida', 'La solicitud fue reenviada a revisión.');
      setShowCorreccion(false);
      await cargarDetalle(Number(id));
    } catch (err: any) {
      toast.error('Error al corregir', err.mensaje);
    }
  };

  const anular = async () => {
    const motivo = window.prompt('Indique el motivo de la anulación:');
    if (!motivo) return;
    try {
      await apiClient(`/solicitudes/${id}/anular`, { method: 'POST', body: { motivo } });
      toast.success('Solicitud anulada', '');
      navigate('/servidor/mis-solicitudes');
    } catch (err: any) {
      toast.error('Error al anular', err.mensaje);
    }
  };

  const abrirCodigoBarras = async () => {
    if (!solicitud) return;
    setShowBarcode(true);
    setBarcodeLoading(true);
    setBarcodeError(null);
    try {
      const url = await obtenerCodigoBarras(solicitud.id_solicitud);
      setBarcodeUrl(url);
    } catch (e: any) {
      setBarcodeError(e?.mensaje || 'No se pudo generar el código de barras.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const cerrarCodigoBarras = () => {
    setShowBarcode(false);
    setBarcodeUrl(null);
    setBarcodeError(null);
  };

  React.useEffect(() => {
    return () => {
      if (barcodeUrl) URL.revokeObjectURL(barcodeUrl);
    };
  }, [barcodeUrl]);

  if (!solicitud) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="mt-4 text-text">Cargando detalle...</p>
      </div>
    );
  }

  const puedeCorregir = solicitud.estado === 'OBSERVADA';
  const puedeAnular = ['BORRADOR', 'PENDIENTE', 'OBSERVADA', 'APROBADA_JEFE'].includes(solicitud.estado);

  const marcaciones = solicitud.marcaciones || [];
  const salida = marcaciones.find((m: any) => m.tipo === 'SALIDA');
  const retorno = marcaciones.find((m: any) => m.tipo === 'RETORNO');

  const timeline = [
    { title: 'Solicitud enviada', subtitulo: 'Servidor', fecha: solicitud.creado_en, completado: true },
    { title: 'Revisión jefe inmediato', subtitulo: 'Jefe', fecha: '', completado: ['APROBADA_JEFE', 'APROBADA_RRHH', 'EN_CURSO', 'EJECUTADA'].includes(solicitud.estado) },
    { title: 'Validación RRHH', subtitulo: 'RRHH', fecha: '', completado: ['APROBADA_RRHH', 'EN_CURSO', 'EJECUTADA'].includes(solicitud.estado) },
    { title: 'Resolución emitida', subtitulo: 'RRHH', fecha: solicitud.fecha_resolucion || '', completado: ['APROBADA_RRHH', 'EN_CURSO', 'EJECUTADA'].includes(solicitud.estado) },
    { title: 'Salida registrada', subtitulo: 'Control', fecha: salida?.fecha_hora || '', completado: !!salida || ['EN_CURSO', 'EJECUTADA'].includes(solicitud.estado) },
    { title: 'Retorno registrado', subtitulo: 'Control', fecha: retorno?.fecha_hora || '', completado: !!retorno || solicitud.estado === 'EJECUTADA' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Detalle de solicitud</h1>
          <p className="text-gray-600">N.º {solicitud.nro_solicitud}</p>
        </div>
        <Badge estado={solicitud.estado} className="px-4 py-2 text-base" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Datos de la solicitud</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase">Tipo</p>
                <p className="font-medium text-text">{solicitud.tipo?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Categoría</p>
                <p className="font-medium text-text">{categoriaLabel(solicitud.tipo?.categoria || '')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Fecha inicio</p>
                <p className="font-medium text-text">{formatearFecha(solicitud.fecha_inicio)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Fecha fin</p>
                <p className="font-medium text-text">{formatearFecha(solicitud.fecha_fin)}</p>
              </div>
              {solicitud.hora_inicio && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Hora salida</p>
                  <p className="font-medium text-text">{solicitud.hora_inicio}</p>
                </div>
              )}
              {solicitud.hora_fin && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Hora retorno</p>
                  <p className="font-medium text-text">{solicitud.hora_fin}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">Cantidad</p>
                <p className="font-medium text-text">{solicitud.cantidad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Motivo</p>
                <p className="font-medium text-text">{solicitud.motivo || '—'}</p>
              </div>
            </div>
          </Card>

          {solicitud.tipo?.unidad_medida === 'HORAS' &&
            ['APROBADA_RRHH', 'EN_CURSO', 'EJECUTADA'].includes(solicitud.estado) && (
              <Card>
                <h2 className="text-lg font-semibold text-text mb-4">Código de papeleta</h2>
                {solicitud.token_codigo ? (
                  <div className="space-y-3">
                    <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                      {solicitud.token_codigo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Use este mismo código para la salida y el retorno. Control de Personal lo escaneará.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard?.writeText(String(solicitud.token_codigo));
                          toast.success('Código copiado', 'Puede mostrarlo o dictarlo a Control de Personal.');
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar código
                      </Button>
                      <Button variant="primary" onClick={abrirCodigoBarras}>
                        Ver código de barras
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    RRHH aún no ha generado el código. Aparecerá aquí cuando emita la papeleta.
                  </p>
                )}
              </Card>
            )}

          {solicitud.adjuntos && solicitud.adjuntos.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-text mb-4">Adjuntos</h2>
              <div className="space-y-3">
                {solicitud.adjuntos.map((a: any) => (
                  <div key={a.id_adjunto} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-text">{a.nombre_arch}</p>
                      <p className="text-xs text-gray-500">{a.mime || ''} • {Math.round((a.tamano_bytes || 0) / 1024)} KB</p>
                    </div>
                    {a.confidencial && <ConfidentialBadge />}
                    <button
                      type="button"
                      onClick={() => setAdjuntoVista(a)}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      Ver evidencia
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {solicitud.historial && solicitud.historial.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-text mb-4">Historial y comentarios</h2>
              <div className="space-y-3">
                {solicitud.historial.map((h: any) => (
                  <div key={h.id_hist} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between gap-3 text-xs text-gray-500">
                      <span>{h.usuario_nombre || 'Sistema'}</span>
                      <span>{h.creado_en}</span>
                    </div>
                    <p className="text-sm text-text mt-1">
                      {h.estado_ant ? `${h.estado_ant} → ` : ''}{h.estado_new}
                    </p>
                    {h.comentario && <p className="text-sm text-gray-600 mt-1">{h.comentario}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Línea de tiempo</h3>
            <div className="space-y-0">
              {timeline.map((item, i) => (
                <TimelineItem key={i} {...item} />
              ))}
            </div>
          </Card>

          <div className="space-y-3">
            {solicitud.estado === 'BORRADOR' && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate(`/servidor/borradores/${solicitud.id_solicitud}`)}
              >
                Editar borrador
              </Button>
            )}
            {puedeCorregir && (
              <Button variant="outline" className="w-full" onClick={abrirCorreccion}>
                Corregir solicitud
              </Button>
            )}
            {puedeAnular && (
              <Button variant="danger" className="w-full" onClick={anular}>
                Anular solicitud
              </Button>
            )}
            {!puedeCorregir && !puedeAnular && solicitud.estado !== 'BORRADOR' && (
              <div className="text-sm text-gray-500 text-center">
                No hay acciones disponibles para este estado.
              </div>
            )}
          </div>
        </div>
      </div>

      {showCorreccion && (
        <Card>
          <h2 className="text-lg font-semibold text-text mb-4">Corregir solicitud observada</h2>
          <form onSubmit={guardarCorreccion} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha inicio"
              type="date"
              value={correccion.fecha_inicio}
              onChange={(e) => setCorreccion({ ...correccion, fecha_inicio: e.target.value })}
            />
            <Input
              label="Fecha fin"
              type="date"
              value={correccion.fecha_fin}
              onChange={(e) => setCorreccion({ ...correccion, fecha_fin: e.target.value })}
            />
            <Input
              label="Hora inicio"
              type="time"
              value={correccion.hora_inicio}
              onChange={(e) => setCorreccion({ ...correccion, hora_inicio: e.target.value })}
            />
            <Input
              label="Hora fin"
              type="time"
              value={correccion.hora_fin}
              onChange={(e) => setCorreccion({ ...correccion, hora_fin: e.target.value })}
            />
            <div className="md:col-span-2">
              <TextArea
                label="Motivo"
                rows={3}
                value={correccion.motivo}
                onChange={(e) => setCorreccion({ ...correccion, motivo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" variant="primary">Guardar y reenviar</Button>
              <Button type="button" variant="outline" onClick={() => setShowCorreccion(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showBarcode && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Código de barras de la papeleta"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Código de barras</h2>
              <button
                type="button"
                onClick={cerrarCodigoBarras}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>

            {barcodeLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-3 text-sm text-gray-500">Generando código de barras...</p>
              </div>
            ) : barcodeError ? (
              <p className="text-sm text-red-600">{barcodeError}</p>
            ) : barcodeUrl ? (
              <div className="text-center space-y-4">
                <img src={barcodeUrl} alt="Código de barras" className="mx-auto w-full max-w-md" />
                <p className="font-mono text-xl font-bold tracking-widest text-text">
                  {solicitud.token_codigo}
                </p>
                <p className="text-sm text-gray-600">
                  Escanee este código en Control de Personal. Sirve para salida y retorno.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <VistaPreviaAdjunto
        idSolicitud={solicitud.id_solicitud}
        adjunto={adjuntoVista}
        onClose={() => setAdjuntoVista(null)}
      />
    </div>
  );
}
