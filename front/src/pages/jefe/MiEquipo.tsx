import React from 'react';
import { apiClient } from '@/services/api';
import { Card, useToast } from '@/components/common';
import { formatearFecha, unidadLabel, asBool } from '@/utils/format';
import { User, Clock, FileText } from 'lucide-react';

export default function MiEquipo() {
  const { toast } = useToast();
  const [equipo, setEquipo] = React.useState<any>({ fuera: [], programados: [] });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const res = await apiClient<any>('/aprobaciones/equipo');
      setEquipo(res.data || { fuera: [], programados: [] });
    } catch (e: any) {
      toast.error('Error al cargar equipo', e.mensaje);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Mi equipo</h1>
        <p className="text-gray-600">Consulte quién está fuera ahora y quién tiene ausencias programadas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-text mb-4">
            <User className="w-4 h-4 mr-2" /> Personal fuera ahora
          </h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : equipo.fuera.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nadie está fuera en este momento.</p>
          ) : (
            <div className="space-y-3">
              {equipo.fuera.map((e: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-text">{e.servidor}</span>
                    {asBool(e.es_urgente) && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">EMERGENCIA</span>}
                  </div>
                  <p className="text-xs text-gray-600">{e.unidad || '—'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">Salida: {formatearFecha(e.hora_salida || '')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-text mb-4">
            <FileText className="w-4 h-4 mr-2" /> Ausencias programadas
          </h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : equipo.programados.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay ausencias programadas próximas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Servidor</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Fechas</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {equipo.programados.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-text">{e.servidor}</td>
                      <td className="px-4 py-2 text-sm text-text">{e.tipo_nombre}</td>
                      <td className="px-4 py-2 text-sm text-text">
                        {formatearFecha(e.fecha_inicio)} - {formatearFecha(e.fecha_fin)}
                      </td>
                      <td className="px-4 py-2 text-sm text-text">{e.cantidad} {unidadLabel(e.unidad_medida || 'DIAS')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
