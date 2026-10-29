import React, { useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Badge, Button, Card, useToast } from '@/components/common';
import FormularioRegularizacion from '@/components/regularizaciones/FormularioRegularizacion';
import { asBool, asNum, diasRestantes, esVencida, formatearFecha } from '@/utils/format';
import { AlertTriangle, Clock, X } from 'lucide-react';

export default function Regularizaciones() {
  const { toast } = useToast();
  const [regularizaciones, setRegularizaciones] = React.useState<any[]>([]);
  const [tipos, setTipos] = React.useState<any[]>([]);
  const [seleccionada, setSeleccionada] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>('/rrhh/regularizaciones');
      setRegularizaciones(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar regularizaciones', e.mensaje);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    cargar();
    apiClient<any>('/catalogos/tipos')
      .then((res) =>
        setTipos(
          (res.data || []).filter(
            (t: any) => asBool(t.activo) && t.codigo !== 'PER_EMERGENCIA'
          )
        )
      )
      .catch(() => setTipos([]));
  }, [cargar]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const vencidas = regularizaciones.filter((r) => esVencida(r.fecha_limite_regularizacion));
  const porVencer = regularizaciones.filter(
    (r) =>
      !esVencida(r.fecha_limite_regularizacion) &&
      diasRestantes(r.fecha_limite_regularizacion) <= 3
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Regularizaciones pendientes</h1>
        <p className="text-gray-600">
          Controle y complete las salidas de emergencia pendientes de regularización.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-red-50 border border-red-100">
          <p className="text-xs text-red-600 uppercase font-semibold mb-1">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{vencidas.length}</p>
        </Card>
        <Card className="p-4 bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-600 uppercase font-semibold mb-1">
            Por vencer (≤ 3 días)
          </p>
          <p className="text-2xl font-bold text-amber-600">{porVencer.length}</p>
        </Card>
        <Card className="p-4 bg-green-50 border border-green-100">
          <p className="text-xs text-green-600 uppercase font-semibold mb-1">
            Total pendientes
          </p>
          <p className="text-2xl font-bold text-green-600">{regularizaciones.length}</p>
        </Card>
      </div>

      {regularizaciones.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay regularizaciones pendientes.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  N.º solicitud
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Servidor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Fecha límite
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Días restantes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...regularizaciones]
                .sort(
                  (a, b) =>
                    diasRestantes(a.fecha_limite_regularizacion) -
                    diasRestantes(b.fecha_limite_regularizacion)
                )
                .map((r) => {
                  const dr = diasRestantes(r.fecha_limite_regularizacion);
                  const v = esVencida(r.fecha_limite_regularizacion);
                  return (
                    <tr
                      key={r.id_solicitud}
                      className={`hover:bg-gray-50 ${v ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {r.nro_solicitud}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{r.servidor || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text">
                        {r.tipo_nombre || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {formatearFecha(r.fecha_limite_regularizacion)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-bold ${
                            v ? 'text-red-600' : dr <= 3 ? 'text-amber-600' : 'text-green-600'
                          }`}
                        >
                          {v ? 'VENCIDA' : dr + ' día(s)'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge estado={v ? 'RECHAZADA' : dr <= 3 ? 'REGULARIZAR' : 'PENDIENTE'} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          className="whitespace-nowrap"
                          onClick={() => setSeleccionada(r)}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Regularizar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {seleccionada && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSeleccionada(null)}
          />

          <div className="relative bg-card w-full max-w-2xl max-h-[94vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-text">
                  Regularizar solicitud {seleccionada.nro_solicitud}
                </h2>
                <p className="text-sm text-gray-600">
                  {seleccionada.servidor}
                  {seleccionada.unidad ? ` · ${seleccionada.unidad}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeleccionada(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-text"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <FormularioRegularizacion
                key={asNum(seleccionada.id_solicitud)}
                solicitud={seleccionada}
                tipos={tipos}
                submitLabel="Guardar regularización"
                onCancel={() => setSeleccionada(null)}
                onCompleted={() => {
                  setSeleccionada(null);
                  cargar();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
