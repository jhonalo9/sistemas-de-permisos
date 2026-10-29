import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button, Card, useToast } from '@/components/common';
import { formatearFecha, unidadLabel } from '@/utils/format';
import { FileText } from 'lucide-react';
export default function BandejaAprobaciones() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>('/aprobaciones/pendientes');
      setSolicitudes(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar aprobaciones', e.mensaje);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Bandeja de aprobaciones</h1>
        <p className="text-gray-600">Solicitudes pendientes de su equipo a la espera de su decisión.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : solicitudes.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay solicitudes pendientes de aprobación.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N.º solicitud</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fechas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Antigüedad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitudes.map((s) => (
                <tr key={s.id_solicitud} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-text">{s.nro_solicitud}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.servidor || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.unidad || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.tipo_nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">
                    {formatearFecha(s.fecha_inicio)} - {formatearFecha(s.fecha_fin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{s.cantidad} {unidadLabel(s.unidad_medida || 'DIAS')}</td>
                  <td className="px-4 py-3 text-sm text-text">
                    {Math.floor(Date.now() / 86400000) - Math.floor(new Date(s.creado_en).getTime() / 86400000)} días
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/jefe/aprobaciones/${s.id_solicitud}`)}
                    >
                      Ver detalle
                    </Button>
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
