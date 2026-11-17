import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Badge, useToast } from '@/components/common';
import { asBool } from '@/utils/format';
import { Clock } from 'lucide-react';

export default function PersonalFuera() {
  const { toast } = useToast();
  const [fuera, setFuera] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cerrando, setCerrando] = React.useState<number | null>(null);

  const cargar = React.useCallback(async () => {
    try {
      const res = await apiClient<any>('/marcaciones/fuera');
      setFuera(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar personal fuera', e.mensaje);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarSinRetorno = async (registro: any) => {
    const confirmado = window.confirm(
      `¿Cerrar el permiso de ${registro.servidor} sin retorno? Se calculará el tiempo hasta este momento.`
    );
    if (!confirmado) return;

    setCerrando(Number(registro.id_solicitud));
    try {
      const res = await apiClient<any>(
        `/marcaciones/${registro.id_solicitud}/cerrar-sin-retorno`,
        { method: 'POST', body: { observacion: 'Cierre manual sin retorno desde Control.' } }
      );
      toast.success('Permiso cerrado', res.mensaje || 'El permiso se cerró sin retorno.');
      await cargar();
    } catch (e: any) {
      toast.error('No se pudo cerrar', e?.mensaje || 'Verifique el estado del permiso.');
    } finally {
      setCerrando(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-text">Personal fuera ahora</h1>
        <p className="text-gray-600">Consulte qué servidores están fuera de la unidad en este momento.</p>
      </div>

      {fuera.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay personal fuera en este momento.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hora salida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Minutos fuera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Retorno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alerta</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fuera.map((p, i) => {
                const sinRetorno = Number(p.con_retorno) === 0;
                return (
                  <tr key={i} className={`hover:bg-gray-50 ${asBool(p.es_urgente) ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-text">{p.servidor}</td>
                    <td className="px-4 py-3 text-sm text-text">{p.unidad || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text">{p.hora_salida || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {p.minutos_fuera ?? '—'} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge estado={asBool(p.es_urgente) ? 'REGULARIZAR' : 'EN_CURSO'} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sinRetorno ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          SIN RETORNO
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Con retorno</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {asBool(p.es_urgente) ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">URGENTE</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sinRetorno ? (
                        <Button
                          variant="outline"
                          onClick={() => cerrarSinRetorno(p)}
                          disabled={cerrando === Number(p.id_solicitud)}
                        >
                          {cerrando === Number(p.id_solicitud) ? 'Cerrando...' : 'Cerrar sin retorno'}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">Esperando retorno</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
