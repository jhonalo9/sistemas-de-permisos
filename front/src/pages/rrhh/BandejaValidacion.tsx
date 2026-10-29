import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button, Badge, Card, useToast } from '@/components/common';
import { formatearFecha, estadoLabel, unidadLabel, asBool, asNum } from '@/utils/format';
import { FileText, Search } from 'lucide-react';

import { errorMessage } from '@/utils/format';

export default function BandejaValidacion() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = React.useState('');
  const [filtroTipo, setFiltroTipo] = React.useState('');
  const [filtroUnidad, setFiltroUnidad] = React.useState('');
  const [fechaDesde, setFechaDesde] = React.useState('');
  const [fechaHasta, setFechaHasta] = React.useState('');
  const [tipos, setTipos] = React.useState<any[]>([]);
  const [unidades, setUnidades] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    cargarDatos(filtroEstado);
  }, [filtroEstado]);

  async function cargarDatos(estado: string) {
  setLoading(true);
  try {
    // 1) Bandeja: crítica, si falla mostramos error
    const sRes = await apiClient<any>(`/rrhh/bandeja?estado=${encodeURIComponent(estado || 'APROBADA_JEFE')}`);
    setSolicitudes(Array.isArray(sRes.data) ? sRes.data : []);

    // 2) Catálogos: opcionales, no deben tumbar la pantalla
    const [tRes, uRes] = await Promise.allSettled([
      apiClient<any>('/catalogos/tipos?activo=1'),
      apiClient<any>('/catalogos/unidades'),
    ]);

    if (tRes.status === 'fulfilled' && Array.isArray(tRes.value.data)) {
      setTipos(tRes.value.data.filter((t: any) => asBool(t.activo)));
    } else if (tRes.status === 'rejected') {
      console.warn('Falló /catalogos/tipos:', tRes.reason);
    }

    if (uRes.status === 'fulfilled' && Array.isArray(uRes.value.data)) {
      setUnidades(uRes.value.data);
    } else if (uRes.status === 'rejected') {
      console.warn('Falló /catalogos/unidades:', uRes.reason);
    }
  } catch (e: any) {
    toast.error('Error al cargar bandeja', errorMessage(e) || e?.mensaje || 'desconocido');
  } finally {
    setLoading(false);
  }
}

  const filtradas = solicitudes.filter((s) => {
    if (filtroEstado && s.estado !== filtroEstado) return false;
    if (filtroTipo && asNum(s.id_tipo) !== asNum(filtroTipo)) return false;
    if (filtroUnidad && asNum(s.id_unidad) !== asNum(filtroUnidad)) return false;
    if (fechaDesde && s.fecha_inicio < fechaDesde) return false;
    if (fechaHasta && s.fecha_inicio > fechaHasta) return false;
    return true;
  });

  const estados = ['APROBADA_JEFE', 'APROBADA_RRHH', 'OBSERVADA', 'RECHAZADA'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Bandeja de validación</h1>
        <p className="text-gray-600">Revise y valide las solicitudes aprobadas por el jefe inmediato.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input-field pl-9"
            >
              <option value="">Pendientes de validar</option>
              {estados.map((e) => (
                <option key={e} value={e}>{estadoLabel(e)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full md:w-64">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="input-field"
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-64">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Unidad</label>
          <select
            value={filtroUnidad}
            onChange={(e) => setFiltroUnidad(e.target.value)}
            className="input-field"
          >
            <option value="">Todas las unidades</option>
            {unidades.map((u) => (
              <option key={u.id_unidad} value={u.id_unidad}>{u.nombre}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-44">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
          <input
            type="date"
            className="input-field"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="w-full md:w-44">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
          <input
            type="date"
            className="input-field"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filtradas.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay solicitudes en la bandeja de validación.</p>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Urgente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtradas.map((s) => (
                <tr key={s.id_solicitud} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-text">{s.nro_solicitud}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.servidor || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.unidad || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.tipo_nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">
                    {formatearFecha(s.fecha_inicio)} - {formatearFecha(s.fecha_fin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{s.cantidad} {unidadLabel(s.unidad_medida || 'DIAS')}</td>
                  <td className="px-4 py-3">
                    <Badge estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {asBool(s.es_urgente) ? (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">SÍ</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.estado === 'APROBADA_RRHH' ? (
                      s.unidad_medida === 'HORAS' ? (
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => navigate(`/rrhh/papeleta/${s.id_solicitud}`)}
                        >
                          Emitir papeleta
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">No requiere papeleta</span>
                      )
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/rrhh/bandeja/${s.id_solicitud}`)}
                      >
                        {s.estado === 'APROBADA_JEFE' ? 'Validar' : 'Ver'}
                      </Button>
                    )}
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
