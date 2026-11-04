import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Badge, Button, Card, useToast } from '@/components/common';
import { formatearFecha, unidadLabel } from '@/utils/format';
import { FileText } from 'lucide-react';

function diasAntiguedad(fecha?: string | null): number {
  if (!fecha) return 0;
  const creado = new Date(fecha).getTime();
  if (Number.isNaN(creado)) return 0;
  return Math.max(0, Math.floor(Date.now() / 86400000) - Math.floor(creado / 86400000));
}

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
        <>
          {/* Vista para celular */}
          <div className="md:hidden space-y-3">
            {solicitudes.map((s) => {
              const antiguedad = diasAntiguedad(s.creado_en);

              return (
                <Card key={s.id_solicitud} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase">Solicitud</p>
                        <p className="font-semibold text-text truncate">{s.nro_solicitud}</p>
                      </div>
                    </div>
                    <Badge estado="PENDIENTE" className="shrink-0" />
                  </div>

                  <div>
                    <p className="font-medium text-text">{s.servidor || '—'}</p>
                    <p className="text-xs text-gray-500">{s.unidad || '—'}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500 shrink-0">Tipo</span>
                      <span className="text-right font-medium text-text">{s.tipo_nombre || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500 shrink-0">Fechas</span>
                      <span className="text-right text-text">
                        {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500 shrink-0">Cantidad</span>
                      <span className="text-right font-medium text-text">
                        {s.cantidad} {unidadLabel(s.unidad_medida || 'DIAS')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500 shrink-0">Antigüedad</span>
                      <span className="text-right text-text">
                        {antiguedad} {antiguedad === 1 ? 'día' : 'días'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/jefe/aprobaciones/${s.id_solicitud}`)}
                  >
                    Ver detalle
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Vista para pantallas grandes */}
          <div className="hidden md:block overflow-x-auto">
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
                    <td className="px-4 py-3 text-sm text-text">
                      {s.cantidad} {unidadLabel(s.unidad_medida || 'DIAS')}
                    </td>
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
        </>
      )}
    </div>
  );
}
