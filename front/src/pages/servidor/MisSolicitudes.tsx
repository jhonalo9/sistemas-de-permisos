import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button, Badge, Card, useToast } from '@/components/common';
import { formatearFecha, estadoLabel, estadoColor, categoriaLabel, unidadLabel } from '@/utils/format';
import { FileText, Search, Filter, Clock } from 'lucide-react';

export default function MisSolicitudes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = React.useState('');
  const [filtroAnio, setFiltroAnio] = React.useState(String(new Date().getFullYear()));
  const [loading, setLoading] = React.useState(true);

  const estados = [
    'BORRADOR', 'REGULARIZAR', 'PENDIENTE', 'OBSERVADA', 'APROBADA_JEFE',
    'APROBADA_RRHH', 'PENDIENTE_GERENCIA', 'EN_CURSO', 'RECHAZADA', 'ANULADA', 'EJECUTADA',
  ];

  React.useEffect(() => {
    cargar();
  }, [filtroEstado, filtroAnio]);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set('estado', filtroEstado);
      if (filtroAnio) params.set('anio', filtroAnio);
      const res = await apiClient<any>(`/solicitudes?${params.toString()}`);
      setSolicitudes(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar solicitudes', e.mensaje);
    } finally {
      setLoading(false);
    }
  }

  const filtradas = solicitudes.filter((s) => !filtroEstado || s.estado === filtroEstado);

  const renderAccion = (s: any, className = '') => {
    if (s.estado === 'BORRADOR') {
      return (
        <Button
          variant="outline"
          className={className}
          onClick={() => navigate(`/servidor/borradores/${s.id_solicitud}`)}
        >
          Continuar
        </Button>
      );
    }

    if (s.estado === 'REGULARIZAR') {
      return (
        <Button
          variant="primary"
          className={className}
          onClick={() => navigate('/servidor/regularizar')}
        >
          <Clock className="w-4 h-4 mr-1" />
          Regularizar
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        className={className}
        onClick={() => navigate(`/servidor/mis-solicitudes/${s.id_solicitud}`)}
      >
        Ver
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis solicitudes</h1>
        <p className="text-gray-600">Consulte el estado de sus solicitudes de permisos y licencias.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-end">
        <div className="flex-1">
          <InputLabel>Filtros</InputLabel>
          <div className="flex items-center gap-1">
            
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input-field pl-4 pr-8"
            >
              <option value="">Todos los estados</option>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {estadoLabel(e)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full md:w-48">
          <InputLabel>Año</InputLabel>
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
            className="input-field"
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={String(a)}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Vista para celular */}
          <div className="md:hidden space-y-3">
            {filtradas.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-sm text-gray-500">No se encontraron solicitudes.</p>
              </Card>
            ) : (
              filtradas.map((s) => (
                <Card key={s.id_solicitud} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 uppercase">Solicitud</p>
                      <p className="font-semibold text-text mt-0.5">{s.nro_solicitud}</p>
                    </div>
                    <Badge estado={s.estado} />
                  </div>

                  <p className="font-medium text-text mt-3">{s.tipo?.nombre || '—'}</p>

                  <div className="flex items-end justify-between gap-3 mt-2 text-sm">
                    <span className="text-gray-600">
                      {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                    </span>
                    <span className="font-semibold text-text whitespace-nowrap">
                      {s.cantidad} {unidadLabel(s.tipo?.unidad_medida || 'DIAS')}
                    </span>
                  </div>

                  <div className="mt-4">
                    {renderAccion(s, 'w-full')}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Vista para escritorio */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N.º solicitud</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fechas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtradas.length > 0 ? (
                  filtradas.map((s) => (
                    <tr key={s.id_solicitud} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-text">{s.nro_solicitud}</td>
                      <td className="px-4 py-3 text-sm text-text">{s.tipo?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text">
                        {formatearFecha(s.fecha_inicio)} - {formatearFecha(s.fecha_fin)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {s.cantidad} {unidadLabel(s.tipo?.unidad_medida || 'DIAS')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge estado={s.estado} />
                      </td>
                      <td className="px-4 py-3">
                        {renderAccion(s)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No se encontraron solicitudes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{children}</div>;
}
