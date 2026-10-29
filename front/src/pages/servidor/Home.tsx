import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Button, Badge, Card, ProgressBar, useToast } from '@/components/common';
import { formatearFecha, unidadLabel } from '@/utils/format';
import { AlertTriangle, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function ServidorHome() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saldos, setSaldos] = React.useState<any[]>([]);
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [regularizaciones, setRegularizaciones] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [sRes, solRes, regRes] = await Promise.all([
        apiClient<any>('/saldos/mios'),
        apiClient<any>('/solicitudes?anio=' + new Date().getFullYear()),
        apiClient<any>('/regularizaciones'),
      ]);
      setSaldos(sRes.data || []);
      setSolicitudes(solRes.data || []);
      setRegularizaciones(regRes.data || []);
    } catch (e: any) {
      toast.error('Error al cargar datos', e.mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, []); // mount only

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-text">Cargando panel...</p>
      </div>
    );
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE' || s.estado === 'OBSERVADA').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">Bienvenido, {usuario?.nombre}</h1>
        <p className="text-text-muted mt-1">Aquí encontrará un resumen de sus solicitudes y saldos.</p>
      </div>

      {regularizaciones.length > 0 && (
        <Card className="p-5 border border-amber-200 bg-amber-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">
                  Tiene {regularizaciones.length} salida(s) de emergencia por regularizar
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  Complete el tipo definitivo, las horas reales y adjunte la evidencia antes de la fecha límite.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="sm:min-w-[180px]"
              onClick={() => navigate('/servidor/regularizar')}
            >
              Regularizar ahora
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Solicitudes pendientes</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{pendientes}</p>
            </div>
            <div className="stat-icon bg-primary-50 text-primary-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Saldo horas permiso personal</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">
                {saldos.find((s) => s.tipo?.categoria === 'PERMISO')?.asignado || 0}h
              </p>
            </div>
            <div className="stat-icon bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Saldo días licencia sin goce</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">
                {saldos.find((s) => s.tipo?.categoria === 'LICENCIA' && !s.tipo?.con_goce)?.asignado || 0}d
              </p>
            </div>
            <div className="stat-icon bg-violet-50 text-violet-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-text">Últimas solicitudes</h2>
        <Button variant="primary" className="sm:min-w-[180px]" onClick={() => navigate('/servidor/nueva')}>
          Nueva solicitud
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-card">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">N.º solicitud</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Fechas</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Cantidad</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {solicitudes.slice(0, 5).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                  No hay solicitudes registradas este año.
                </td>
              </tr>
            ) : (
              solicitudes.slice(0, 5).map((s, i) => (
                <tr key={s.id_solicitud ?? i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-sm text-text font-medium">{s.nro_solicitud || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.tipo?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">
                    {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text">
                    {s.cantidad ?? '—'} {unidadLabel(s.tipo?.unidad_medida || 'DIAS')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge estado={s.estado || 'BORRADOR'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {saldos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Mis saldos por tipo</h2>
          <div className="space-y-4">
            {saldos.map((s) => (
              <Card key={s.id_saldo} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-text">{s.tipo?.nombre}</span>
                  <span className="text-sm font-semibold text-primary">
                    {s.usado}/{s.asignado} {unidadLabel(s.tipo?.unidad_medida || 'DIAS')}
                  </span>
                </div>
                <ProgressBar valor={s.usado} maximo={s.asignado} />
                <p className="text-xs text-gray-500 mt-1">
                  Disponible: {s.asignado - s.usado} {unidadLabel(s.tipo?.unidad_medida || 'DIAS')}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
