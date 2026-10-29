import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Badge, Button, Card, useToast } from '@/components/common';
import FormularioRegularizacion from '@/components/regularizaciones/FormularioRegularizacion';
import { asBool, asNum, diasRestantes, esVencida, formatearFecha, unidadLabel } from '@/utils/format';

type Vista = 'pendientes' | 'regularizadas';

export default function CompletarRegularizacion() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [regularizaciones, setRegularizaciones] = React.useState<any[]>([]);
  const [historial, setHistorial] = React.useState<any[]>([]);
  const [tipos, setTipos] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [vista, setVista] = React.useState<Vista>('pendientes');
  const [loading, setLoading] = React.useState(true);

  const cargar = useCallback(async () => {
    try {
      const [pendientesRes, historialRes] = await Promise.all([
        apiClient<any>('/regularizaciones'),
        apiClient<any>('/regularizaciones/historial'),
      ]);
      setRegularizaciones(pendientesRes.data || []);
      setHistorial(historialRes.data || []);
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

  const seleccionada = regularizaciones.find(
    (r) => asNum(r.id_solicitud) === asNum(selectedId)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Completar regularización</h1>
        <p className="text-gray-600">
          Regularice sus salidas de emergencia pendientes y consulte las que ya fueron regularizadas.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setVista('pendientes')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            vista === 'pendientes'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-text'
          }`}
        >
          Pendientes ({regularizaciones.length})
        </button>
        <button
          type="button"
          onClick={() => setVista('regularizadas')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            vista === 'regularizadas'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-text'
          }`}
        >
          Regularizadas ({historial.length})
        </button>
      </div>

      {vista === 'pendientes' && (
        <>
          {regularizaciones.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-600">
                No tiene salidas de emergencia pendientes de regularización.
              </p>
              {historial.length > 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setVista('regularizadas')}
                >
                  Ver regularizadas
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-lg font-semibold text-text mb-4">
                  Salidas pendientes de regularización
                </h2>
                <div className="space-y-3">
                  {regularizaciones.map((r) => {
                    const dr = diasRestantes(r.fecha_limite_regularizacion);
                    const v = esVencida(r.fecha_limite_regularizacion);
                    return (
                      <div
                        key={r.id_solicitud}
                        onClick={() => setSelectedId(asNum(r.id_solicitud))}
                        className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                          asNum(selectedId) === asNum(r.id_solicitud)
                            ? 'bg-blue-50 border-blue-200'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-text">{r.nro_solicitud}</span>
                          {v && <span className="text-xs font-bold text-red-600">VENCIDA</span>}
                        </div>
                        <p className="text-xs text-gray-600">{r.motivo || 'Sin motivo'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-xs font-bold ${
                              v ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {dr} días restantes
                          </span>
                          <span className="text-xs text-gray-500">
                            Límite: {formatearFecha(r.fecha_limite_regularizacion)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {seleccionada && (
                <Card>
                  <h2 className="text-lg font-semibold text-text mb-4">
                    Datos de la regularización
                  </h2>
                  <FormularioRegularizacion
                    key={asNum(seleccionada.id_solicitud)}
                    solicitud={seleccionada}
                    tipos={tipos}
                    onCompleted={() => {
                      setSelectedId(null);
                      cargar();
                    }}
                  />
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {vista === 'regularizadas' && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-text">Salidas regularizadas</h2>
            <p className="text-sm text-gray-600">
              Estas salidas ya tienen un tipo definitivo y siguen su flujo de aprobación.
            </p>
          </div>

          {historial.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Aún no tiene salidas regularizadas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      N.º solicitud
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Tipo definitivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Salida
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Cantidad
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
                  {historial.map((h) => (
                    <tr key={h.id_solicitud} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {h.nro_solicitud}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        <p>{h.tipo_nombre || '—'}</p>
                        <p className="text-xs text-gray-500">{h.unidad || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                        <p>{formatearFecha(h.fecha_inicio)}</p>
                        <p className="text-xs text-gray-500">
                          {(h.hora_inicio || '').slice(0, 5)}
                          {h.hora_fin ? ` - ${(h.hora_fin || '').slice(0, 5)}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                        {h.cantidad} {unidadLabel(h.unidad_medida || 'DIAS')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge estado={h.estado} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/servidor/mis-solicitudes/${h.id_solicitud}`)}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
