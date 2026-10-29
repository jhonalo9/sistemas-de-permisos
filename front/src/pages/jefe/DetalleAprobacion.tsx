import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button, Badge, Card, ConfidentialBadge, useToast } from '@/components/common';
import VistaPreviaAdjunto from '@/components/adjuntos/VistaPreviaAdjunto';
import { formatearFecha, categoriaLabel, unidadLabel } from '@/utils/format';
import { FileText, Check, AlertTriangle, Eye } from 'lucide-react';

export default function DetalleAprobacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = React.useState<any>(null);
  const [equipo, setEquipo] = React.useState<any[]>([]);
  const [adjuntoVista, setAdjuntoVista] = React.useState<any | null>(null);

  React.useEffect(() => {
    const cargarDetalle = async (idSolicitud: number) => {
      try {
        const res = await apiClient<any>(`/aprobaciones/${idSolicitud}`);
        setSolicitud(res.data?.solicitud || null);
        setEquipo(res.data?.equipo_ausente || []);
      } catch (e: any) {
        toast.error('Error al cargar detalle', e.mensaje);
      }
    };

    if (id) cargarDetalle(Number(id));
  }, [id]);

  async function decidir(accion: 'aprobar' | 'observar' | 'rechazar', comentario?: string) {
    try {
      await apiClient<any>(`/aprobaciones/${id}/${accion}`, {
        method: 'POST',
        body: accion === 'observar' ? { comentario } : accion === 'rechazar' ? { motivo: comentario } : {},
      });
      toast.success('Decisión registrada', `Solicitud ${accion === 'observar' ? 'observada' : accion === 'rechazar' ? 'rechazada' : 'aprobada'}.`);
      navigate('/jefe/aprobaciones');
    } catch (e: any) {
      toast.error('Error al registrar decisión', e.mensaje);
    }
  }

  if (!solicitud) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const saldoTexto = solicitud.servidor?.saldo
    ? `${solicitud.servidor.saldo.usado}/${solicitud.servidor.saldo.asignado} ${unidadLabel(solicitud.tipo?.unidad_medida || 'DIAS')}`
    : '—';

  const servidorNombre = [solicitud.servidor?.apellidos, solicitud.servidor?.nombres]
    .filter(Boolean)
    .join(', ') || '—';

  const jefeNombre = solicitud.jefe?.nombre
    || [solicitud.jefe?.apellidos, solicitud.jefe?.nombres].filter(Boolean).join(', ')
    || '—';

  const adjuntos = solicitud.adjuntos || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Decisión de solicitud</h1>
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
                <p className="text-xs text-gray-500 uppercase">Servidor</p>
                <p className="font-medium text-text">{servidorNombre}</p>
                {solicitud.servidor?.dni && (
                  <p className="text-xs text-gray-500">DNI: {solicitud.servidor.dni}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Cargo</p>
                <p className="font-medium text-text">{solicitud.servidor?.cargo || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Unidad</p>
                <p className="font-medium text-text">{solicitud.servidor?.unidad || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Jefe inmediato</p>
                <p className="font-medium text-text">{jefeNombre}</p>
              </div>
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
                <p className="font-medium text-text">{formatearFecha(solicitud.fecha_inicio || '')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Fecha fin</p>
                <p className="font-medium text-text">{formatearFecha(solicitud.fecha_fin || '')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Cantidad</p>
                <p className="font-medium text-text">
                  {solicitud.cantidad} {unidadLabel(solicitud.tipo?.unidad_medida || 'DIAS')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Saldo servidor</p>
                <p className="font-medium text-text">{saldoTexto}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase">Motivo</p>
                <p className="font-medium text-text">{solicitud.motivo || '—'}</p>
              </div>
            </div>
          </Card>

          {adjuntos.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-text mb-4">Adjuntos</h2>
              <div className="space-y-3">
                {adjuntos.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-text">{a.nombre_arch}</p>
                      <p className="text-xs text-gray-500">{a.mime || ''}</p>
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

          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Calendario del equipo</h2>
            <p className="text-sm text-gray-600 mb-4">Otros servidores ausentes en las mismas fechas:</p>
            {equipo.length > 0 ? (
              <div className="space-y-2">
                {equipo.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-text">{e.servidor}</span>
                    <span className="text-sm text-gray-600">{formatearFecha(e.fecha_inicio)} - {formatearFecha(e.fecha_fin)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay otros servidores ausentes en esas fechas.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Acciones</h3>
            {solicitud.estado === 'PENDIENTE' ? (
              <div className="space-y-3">
                <Button variant="primary" className="w-full" onClick={() => decidir('aprobar')}>
                  <Check className="w-4 h-4 mr-2" />
                  Aprobar solicitud
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  const c = window.prompt('Indique el motivo de la observación:');
                  if (c) decidir('observar', c);
                }}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Observar (comentario obligatorio)
                </Button>
                <Button variant="danger" className="w-full" onClick={() => {
                  const c = window.prompt('Indique el motivo del rechazo:');
                  if (c) decidir('rechazar', c);
                }}>
                  Rechazar solicitud
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Esta solicitud ya fue atendida. Estado actual: <strong>{solicitud.estado}</strong>.
              </p>
            )}
          </Card>

          <div className="text-sm text-gray-500 space-y-2">
            <p><strong>Nota:</strong> Al observar, el servidor deberá corregir y reenviar. Al rechazar, la solicitud queda descartada.</p>
          </div>
        </div>
      </div>

      <VistaPreviaAdjunto
        idSolicitud={solicitud.id_solicitud}
        adjunto={adjuntoVista}
        onClose={() => setAdjuntoVista(null)}
      />
    </div>
  );
}
