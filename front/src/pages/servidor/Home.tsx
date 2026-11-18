import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Button, Badge, Card, useToast } from '@/components/common';
import { formatearFechaCantidad, asBool } from '@/utils/format';
import { AlertTriangle, Clock, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import ModalNuevaSolicitud from '@/components/solicitudes/ModalNuevaSolicitud';

export default function ServidorHome() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = React.useState<any[]>([]);
  const [totalSolicitudes, setTotalSolicitudes] = React.useState(0);
  const [regularizaciones, setRegularizaciones] = React.useState<any[]>([]);
  const [nuevaSolicitudOpen, setNuevaSolicitudOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [solRes, regRes] = await Promise.all([
        apiClient<any>('/solicitudes?anio=' + new Date().getFullYear()),
        apiClient<any>('/regularizaciones'),
      ]);
      setSolicitudes(solRes.data || []);
      setTotalSolicitudes(Number((solRes as any).total ?? (solRes.data || []).length));
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
  const aprobadas = solicitudes.filter((s) =>
    ['APROBADA_JEFE', 'APROBADA', 'APROBADA_RRHH', 'PENDIENTE_GERENCIA', 'EN_CURSO', 'EJECUTADA'].includes(s.estado)
  ).length;

  const abrirDetalle = (id?: number | string) => {
    if (id === undefined || id === null || id === '') return;
    navigate(`/servidor/mis-solicitudes/${id}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">Bienvenido, {usuario?.nombre}</h1>
          <p className="text-text-muted mt-1">Aquí encontrará un resumen de sus solicitudes.</p>
        </div>
        <div className="flex w-full sm:w-auto justify-end">
 

  <style>{`
  .btn-uiverse {
    outline: 0;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    background: #1B4F9C;
    min-width: 200px;
    border: 0;
    border-radius: 4px;
    /* Sombra más notoria */
    box-shadow: 0 6px 16px rgba(15, 45, 90, 0.55),
                0 2px 6px rgba(0, 0, 0, 0.28);
    box-sizing: border-box;
    padding: 16px 20px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    overflow: hidden;
    cursor: pointer;
    transition: transform 1s ease, box-shadow 1s ease;
  }
  .btn-uiverse:hover {
    opacity: .95;
    /* Sombra aún más elevada al pasar el mouse */
    box-shadow: 0 10px 22px rgba(15, 45, 90, 0.65),
                0 4px 10px rgba(0, 0, 0, 0.32);
    transform: translateY(-1px);
  }
  .btn-uiverse:active {
    transform: translateY(0);
    box-shadow: 0 4px 10px rgba(15, 45, 90, 0.5),
                0 1px 3px rgba(0, 0, 0, 0.25);
  }
  .btn-uiverse .animation {
    border-radius: 100%;
    animation: ripple 0.8s linear infinite;
  }
  @keyframes ripple {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.1),
                  0 0 0 20px rgba(255, 255, 255, 0.1),
                  0 0 0 40px rgba(255, 255, 255, 0.1),
                  0 0 0 60px rgba(255, 255, 255, 0.1);
    }
    100% {
      box-shadow: 0 0 0 20px rgba(255, 255, 255, 0.1),
                  0 0 0 40px rgba(255, 255, 255, 0.1),
                  0 0 0 60px rgba(255, 255, 255, 0.1),
                  0 0 0 80px rgba(255, 255, 255, 0);
    }
  }
`}</style>

  <button
    type="button"
    className="btn-uiverse sm:min-w-[200px]"
    onClick={() => setNuevaSolicitudOpen(true)}
  >
    <i className="animation" aria-hidden="true" />
    + Nueva solicitud
    <i className="animation" aria-hidden="true" />
  </button>
   
        </div>
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
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Solicitudes aprobadas</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{aprobadas}</p>
            </div>
            <div className="stat-icon bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Solicitudes del año</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{totalSolicitudes}</p>
            </div>
            <div className="stat-icon bg-violet-50 text-violet-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

     
 <div>
   <h2 className="text-lg font-semibold text-text">Últimas solicitudes</h2>
   <div className="flex items-center justify-between gap-3 mt-1">
     <p className="text-sm font-sans text-text-muted">Seguimiento de sus trámites recientes</p>
     <button
       type="button"
       onClick={() => navigate('/servidor/mis-solicitudes')}
       className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
     >
       Ver todas
       <ChevronRight className="w-4 h-4" />
     </button>
   </div>
 </div>

      {/* Vista de últimas solicitudes para celular */}
      <div className="md:hidden space-y-3">
        {solicitudes.slice(0, 5).length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-text-muted">No hay solicitudes registradas este año.</p>
          </Card>
        ) : (
          solicitudes.slice(0, 5).map((s, i) => (
            <Card
              key={s.id_solicitud ?? i}
              className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => abrirDetalle(s.id_solicitud)}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalle de la solicitud ${s.nro_solicitud || ''}`}
              title="Ver detalle"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  abrirDetalle(s.id_solicitud);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Solicitud</p>
                  <p className="font-semibold text-text mt-0.5">{s.nro_solicitud || '—'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge estado={s.estado || 'BORRADOR'} />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <p className="font-medium text-text mt-3">{s.tipo?.nombre || '—'}</p>

              <div className="flex items-end justify-between gap-3 mt-2 text-sm text-text-muted">
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
            </Card>
          ))
        )}
      </div>

      {/* Vista de últimas solicitudes para escritorio */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border/80 bg-white shadow-card">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">N.º solicitud</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Fecha / cantidad</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {solicitudes.slice(0, 5).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-muted">
                  No hay solicitudes registradas este año.
                </td>
              </tr>
            ) : (
              solicitudes.slice(0, 5).map((s, i) => (
                <tr
                  key={s.id_solicitud ?? i}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => abrirDetalle(s.id_solicitud)}
                  tabIndex={0}
                  title="Ver detalle"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      abrirDetalle(s.id_solicitud);
                    }
                  }}
                >
                  <td className="px-4 py-3 text-sm text-text font-medium">{s.nro_solicitud || '—'}</td>
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
                    <div className="flex items-center gap-2">
                      <Badge estado={s.estado || 'BORRADOR'} />
                     
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ModalNuevaSolicitud
        isOpen={nuevaSolicitudOpen}
        onClose={() => setNuevaSolicitudOpen(false)}
      />
    </div>
  );
}
