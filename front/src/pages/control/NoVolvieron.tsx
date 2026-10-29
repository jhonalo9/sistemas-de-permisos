import React from 'react';
import { apiClient } from '@/services/api';
import { Card, Badge, useToast } from '@/components/common';
import { asBool } from '@/utils/format';
import { AlertTriangle, Clock } from 'lucide-react';

export default function NoVolvieron() {
  const { toast } = useToast();
  const [registros, setRegistros] = React.useState<any[]>([]);
  const [horaCorte, setHoraCorte] = React.useState('17:00');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient<any>('/marcaciones/no-volvieron');
        setRegistros(res.data || []);
        setHoraCorte((res as any).hora_corte || '17:00');
      } catch (e: any) {
        toast.error('Error al cargar no volvieron', e.mensaje);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">No volvieron al cierre</h1>
        <p className="text-gray-600">
          Salidas sin retorno registradas después de la hora de corte ({horaCorte}).
        </p>
      </div>

      {registros.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                Hay {registros.length} salida(s) sin retorno
              </p>
              <p className="text-sm text-red-700 mt-1">
                Incluye permisos normales y emergencias. Verifique con Control de Personal.
              </p>
            </div>
          </div>
        </Card>
      )}

      {registros.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay salidas pendientes de retorno al cierre de jornada.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">DNI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hora salida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Minutos fuera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registros.map((r) => (
                <tr key={r.id_solicitud} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-text">{r.servidor}</td>
                  <td className="px-4 py-3 text-sm text-text">{r.dni}</td>
                  <td className="px-4 py-3 text-sm text-text">{r.unidad || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{r.cargo || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{r.tipo_nombre}</td>
                  <td className="px-4 py-3 text-sm text-text">{r.hora_salida}</td>
                  <td className="px-4 py-3 text-sm text-text">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {r.minutos_fuera ?? '—'} min
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge estado={asBool(r.es_urgente) ? 'REGULARIZAR' : 'EN_CURSO'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
