import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button, Badge, Card, useToast } from '@/components/common';
import { formatearFechaCantidad, estadoLabel, asBool } from '@/utils/format';
import { Search, ChevronRight, Plus } from 'lucide-react';
import ModalNuevaSolicitud from '@/components/solicitudes/ModalNuevaSolicitud';

export default function MisSolicitudes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = React.useState('');
  const [filtroAnio, setFiltroAnio] = React.useState(String(new Date().getFullYear()));
  const [busqueda, setBusqueda] = React.useState('');
  const [nuevaSolicitudOpen, setNuevaSolicitudOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const estados = [
    'BORRADOR', 'REGULARIZAR', 'PENDIENTE', 'OBSERVADA', 'APROBADA_JEFE',
    'APROBADA', 'APROBADA_RRHH', 'PENDIENTE_GERENCIA', 'EN_CURSO', 'RECHAZADA', 'ANULADA', 'EJECUTADA',
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
      params.set('per_page', '100');
      const res = await apiClient<any>(`/solicitudes?${params.toString()}`);
      setSolicitudes(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar solicitudes', e.mensaje);
    } finally {
      setLoading(false);
    }
  }

  const filtradas = solicitudes.filter((s) => {
    if (filtroEstado && s.estado !== filtroEstado) return false;

    const q = busqueda.trim().toLowerCase();
    if (!q) return true;

    const texto = [
      s.nro_solicitud,
      s.tipo?.nombre,
      s.motivo,
      s.estado,
      estadoLabel(s.estado || ''),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return texto.includes(q);
  });

  const abrirSolicitud = (s: any) => {
    if (s.estado === 'BORRADOR') {
      navigate(`/servidor/borradores/${s.id_solicitud}`);
      return;
    }
    if (s.estado === 'REGULARIZAR') {
      navigate('/servidor/regularizar');
      return;
    }
    navigate(`/servidor/mis-solicitudes/${s.id_solicitud}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Mis solicitudes</h1>
          <p className="text-gray-600">Consulte el estado de sus solicitudes de permisos y licencias.</p>
        </div>
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={() => setNuevaSolicitudOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <InputLabel>Buscar</InputLabel>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="N.º, tipo, motivo o estado"
              className="input-field pl-9"
            />
          </div>
        </div>
        <div className="w-full md:w-56">
          <InputLabel>Estado</InputLabel>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="input-field"
          >
            <option value="">Todos los estados</option>
            {estados.map((e) => (
              <option key={e} value={e}>
                {estadoLabel(e)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-36">
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
                <Card
                  key={s.id_solicitud}
                  className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => abrirSolicitud(s)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver solicitud ${s.nro_solicitud || ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      abrirSolicitud(s);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 uppercase">Solicitud</p>
                      <p className="font-semibold text-text mt-0.5">{s.nro_solicitud}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge estado={s.estado} />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <p className="font-medium text-text mt-3">{s.tipo?.nombre || '—'}</p>

                  <div className="flex items-end justify-between gap-3 mt-2 text-sm">
                    <span className="text-gray-600">
                      {formatearFechaCantidad(
                        s.fecha_inicio,
                        s.fecha_fin,
                        s.cantidad,
                        s.tipo?.unidad_medida || 'DIAS'
                      )}
                    </span>
                    {asBool(s.es_urgente) && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Urgente" />
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Vista para escritorio */}
          <div className="hidden md:block overflow-x-auto shadow-table rounded-2xl border border-border/80 bg-white">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-slate-50/80 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">N.º solicitud</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Fecha / cantidad</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {filtradas.length > 0 ? (
                  filtradas.map((s) => (
                    <tr
                      key={s.id_solicitud}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => abrirSolicitud(s)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          abrirSolicitud(s);
                        }
                      }}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-primary">{s.nro_solicitud}</td>
                      <td className="px-4 py-3 text-sm text-text">{s.tipo?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text">
                        <div className="flex items-center gap-2">
                          <span>
                            {formatearFechaCantidad(
                              s.fecha_inicio,
                              s.fecha_fin,
                              s.cantidad,
                              s.tipo?.unidad_medida || 'DIAS'
                            )}
                          </span>
                          {asBool(s.es_urgente) && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Urgente" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <Badge estado={s.estado} />
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No se encontraron solicitudes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ModalNuevaSolicitud
        isOpen={nuevaSolicitudOpen}
        onClose={() => {
          setNuevaSolicitudOpen(false);
          cargar();
        }}
      />
    </div>
  );
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{children}</div>;
}
