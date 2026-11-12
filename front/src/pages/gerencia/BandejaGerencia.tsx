import React from 'react';
import { apiClient } from '@/services/api';
import { Badge, Button, Card, useToast } from '@/components/common';
import ModalMotivo from '@/components/decisiones/ModalMotivo';
import { formatearFecha, unidadLabel } from '@/utils/format';
import { Check, ChevronRight, FileText, X } from 'lucide-react';

export default function BandejaGerencia() {
  const { toast } = useToast();
  const [pendientes, setPendientes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detalle, setDetalle] = React.useState<any | null>(null);
  const [motivoRechazo, setMotivoRechazo] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);

  const cargar = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>('/gerencia/pendientes');
      setPendientes(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar aprobaciones', e?.mensaje);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirDetalle = async (id: number) => {
    try {
      const res = await apiClient<any>(`/gerencia/${id}`);
      setDetalle(res.data);
    } catch (e: any) {
      toast.error('Error al cargar la solicitud', e?.mensaje);
    }
  };

  const aprobar = async () => {
    if (!detalle) return;
    setProcesando(true);
    try {
      await apiClient(`/gerencia/${detalle.id_solicitud}/aprobar`, { method: 'POST' });
      toast.success('Solicitud aprobada', 'La solicitud fue aprobada por Gerencia.');
      setDetalle(null);
      await cargar();
    } catch (e: any) {
      toast.error('Error al aprobar', e?.mensaje);
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async (motivo: string) => {
    if (!detalle) return;
    await apiClient(`/gerencia/${detalle.id_solicitud}/rechazar`, {
      method: 'POST',
      body: { motivo },
    });
    toast.success('Solicitud rechazada', 'La solicitud fue rechazada por Gerencia.');
    setMotivoRechazo(false);
    setDetalle(null);
    await cargar();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Aprobaciones de Gerencia</h1>
        <p className="text-gray-600">
          Licencias de 20 días o más que requieren aprobación de Gerencia o Titular.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : pendientes.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay solicitudes pendientes de aprobación de Gerencia.</p>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {pendientes.map((s) => (
              <Card
                key={s.id_solicitud}
                className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => abrirDetalle(Number(s.id_solicitud))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') abrirDetalle(Number(s.id_solicitud));
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Solicitud</p>
                    <p className="font-semibold text-text">{s.nro_solicitud}</p>
                    <p className="text-sm text-text mt-2">{s.servidor}</p>
                    <p className="text-xs text-gray-500">{s.unidad || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge estado="PENDIENTE_GERENCIA" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-text mt-3">{s.tipo_nombre}</p>
                <div className="flex justify-between gap-3 mt-2 text-sm text-gray-600">
                  <span>{formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}</span>
                  <span className="font-medium text-text">
                    {s.cantidad} {unidadLabel(s.categoria === 'LICENCIA' ? 'DIAS' : 'HORAS')}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {['N.º', 'Servidor', 'Unidad', 'Tipo', 'Fechas', 'Cantidad', 'Estado', 'Acción'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendientes.map((s) => (
                  <tr key={s.id_solicitud} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{s.nro_solicitud}</td>
                    <td className="px-4 py-3 text-sm">{s.servidor}</td>
                    <td className="px-4 py-3 text-sm">{s.unidad || '—'}</td>
                    <td className="px-4 py-3 text-sm">{s.tipo_nombre}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.cantidad} {unidadLabel(s.categoria === 'LICENCIA' ? 'DIAS' : 'HORAS')}
                    </td>
                    <td className="px-4 py-3"><Badge estado="PENDIENTE_GERENCIA" /></td>
                    <td className="px-4 py-3">
                      <Button variant="outline" onClick={() => abrirDetalle(Number(s.id_solicitud))}>
                        Revisar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {detalle && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetalle(null)} />
          <div className="relative bg-card w-full max-w-3xl max-h-[94vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-text">Solicitud {detalle.nro_solicitud}</h2>
                <p className="text-sm text-gray-600">{detalle.tipo?.nombre}</p>
              </div>
              <button type="button" onClick={() => setDetalle(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500 uppercase">Servidor</p><p className="font-medium">{detalle.servidor?.apellidos}, {detalle.servidor?.nombres}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">DNI</p><p className="font-medium">{detalle.servidor?.dni}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Unidad</p><p className="font-medium">{detalle.servidor?.unidad || '—'}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Cargo</p><p className="font-medium">{detalle.servidor?.cargo || '—'}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Fechas</p><p className="font-medium">{formatearFecha(detalle.fecha_inicio)} – {formatearFecha(detalle.fecha_fin)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Cantidad</p><p className="font-medium">{detalle.cantidad} {unidadLabel(detalle.tipo?.unidad_medida || 'DIAS')}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Resolución RRHH</p><p className="font-medium">{detalle.nro_resolucion || '—'}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Fecha de resolución</p><p className="font-medium">{formatearFecha(detalle.fecha_resolucion || '')}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-gray-500 uppercase">Motivo</p><p className="font-medium">{detalle.motivo || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-gray-500 uppercase">Entrega de cargo</p><p className="font-medium">{Number(detalle.entrega_cargo) === 1 ? 'Declarada' : 'No declarada'}</p></div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setDetalle(null)} disabled={procesando}>Cerrar</Button>
              <Button variant="danger" onClick={() => setMotivoRechazo(true)} disabled={procesando}>Rechazar</Button>
              <Button variant="primary" onClick={aprobar} disabled={procesando}>
                <Check className="w-4 h-4 mr-1" /> {procesando ? 'Aprobando...' : 'Aprobar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ModalMotivo
        isOpen={motivoRechazo}
        onClose={() => setMotivoRechazo(false)}
        titulo="Rechazar solicitud"
        descripcion="Indique el motivo del rechazo de Gerencia."
        etiqueta="Motivo del rechazo"
        placeholder="Explique por qué se rechaza la solicitud..."
        confirmarTexto="Rechazar solicitud"
        peligro
        onConfirm={rechazar}
      />
    </div>
  );
}
