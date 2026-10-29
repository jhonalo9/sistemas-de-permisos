import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button, Badge, Card, ConfidentialBadge, useToast } from '@/components/common';
import VistaPreviaAdjunto from '@/components/adjuntos/VistaPreviaAdjunto';
import { formatearFecha, estadoLabel, estadoColor, categoriaLabel, unidadLabel, errorMessage } from '@/utils/format';
import { FileText, Clock, Check, AlertTriangle, Mail, User, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { validarSchema } from '@/utils/validations';

export default function ValidarSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [adjuntoVista, setAdjuntoVista] = React.useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(validarSchema),
    defaultValues: {
      nro_resolucion: '',
      fecha_resolucion: '',
    },
  });

  React.useEffect(() => {
    if (id) cargarDetalle(Number(id));
  }, [id]);

  async function cargarDetalle(idSolicitud: number) {
    try {
      const res = await apiClient<any>(`/rrhh/${idSolicitud}`);
      setSolicitud(res.data || null);
    } catch (e: any) {
      toast.error('Error al cargar detalle', e.mensaje);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (datos: any) => {
    try {
      await apiClient<any>(`/rrhh/${id}/validar`, {
        method: 'POST',
        body: datos,
      });
      toast.success('Solicitud validada', 'La solicitud ha sido aprobada por RRHH.');
      if (solicitud?.tipo?.unidad_medida === 'HORAS') {
        navigate(`/rrhh/papeleta/${id}`);
      } else {
        navigate('/rrhh/bandeja');
      }
    } catch (e: any) {
      toast.error('Error al validar', e.mensaje);
    }
  };

  const onObservar = async () => {
    const c = window.prompt('Indique el motivo de la observación:');
    if (!c) return;
    try {
      await apiClient<any>(`/rrhh/${id}/observar`, {
        method: 'POST',
        body: { comentario: c },
      });
      toast.success('Solicitud observada', 'Se ha registrado la observación.');
      navigate('/rrhh/bandeja');
    } catch (e: any) {
      toast.error('Error al observar', e.mensaje);
    }
  };

  const onRechazar = async () => {
    const c = window.prompt('Indique el motivo del rechazo:');
    if (!c) return;
    try {
      await apiClient<any>(`/rrhh/${id}/rechazar`, {
        method: 'POST',
        body: { motivo: c },
      });
      toast.success('Solicitud rechazada', 'Se ha rechazado la solicitud.');
      navigate('/rrhh/bandeja');
    } catch (e: any) {
      toast.error('Error al rechazar', e.mensaje);
    }
  };

  if (!solicitud) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const esEmergencia = solicitud.tipo?.codigo === 'PER_EMERGENCIA';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Validar solicitud</h1>
          <p className="text-gray-600">N.º {solicitud.nro_solicitud}</p>
        </div>
        <Badge estado={solicitud.estado} className="px-4 py-2 text-base" />
      </div>

      {esEmergencia && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Esta es una salida de emergencia. Debe completarse desde “Completar regularización” antes de la validación de RRHH.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Datos de la solicitud</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase">Servidor</p>
                <p className="font-medium text-text">{solicitud.servidor?.apellidos + ', ' + solicitud.servidor?.nombres || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Unidad</p>
                <p className="font-medium text-text">{solicitud.servidor?.unidad || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Tipo</p>
                <p className="font-medium text-text">{solicitud.tipo?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Categoría</p>
                <p className="font-medium text-text">{categoriaLabel(solicitud.tipo?.categoria || '')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Base legal</p>
                <p className="font-medium text-text text-sm">{solicitud.tipo?.base_legal || '—'}</p>
              </div>
              {!esEmergencia && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Saldo del servidor</p>
                  {solicitud.servidor?.saldo ? (
                    <div>
                      <p className="font-medium text-text">
                        Asignado: {solicitud.servidor.saldo.asignado} · Usado: {solicitud.servidor.saldo.usado} · Disponible: {solicitud.servidor.saldo.disponible}
                      </p>
                      {Number(solicitud.servidor.saldo.disponible) < Number(solicitud.cantidad) && (
                        <p className="text-sm text-red-600 font-semibold mt-1">
                          Saldo insuficiente para la cantidad solicitada.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-text">Sin saldo registrado</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">Fecha inicio</p>
                <p className="font-medium text-text">{formatearFecha(solicitud.fecha_inicio)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Fecha fin</p>
                <p className="font-medium text-text">{formatearFecha(solicitud.fecha_fin)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Cantidad</p>
                <p className="font-medium text-text">{solicitud.cantidad}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase">Motivo</p>
                <p className="font-medium text-text">{solicitud.motivo || '—'}</p>
              </div>
            </div>
          </Card>

          {solicitud.adjuntos && solicitud.adjuntos.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-text mb-4">Adjuntos</h2>
              <div className="space-y-3">
                {solicitud.adjuntos.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-text">{a.nombre_arch}</p>
                      <p className="text-xs text-gray-500">{a.mime || ''}</p>
                    </div>
                    {a.confidencial && <ConfidentialBadge />}
                    <button
                      type="button"
                      onClick={() => setAdjuntoVista(a)}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      Ver evidencia
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Resolución RRHH</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">N.º de resolución</label>
                <input
                  {...register('nro_resolucion')}
                  className={`input-field ${errors.nro_resolucion ? 'border-red-500' : ''}`}
                />
                {errors.nro_resolucion && <p className="error-text">{errorMessage(errors.nro_resolucion)}</p>}
              </div>
              <div>
                <label className="label">Fecha de resolución</label>
                <input
                  {...register('fecha_resolucion')}
                  type="date"
                  className={`input-field ${errors.fecha_resolucion ? 'border-red-500' : ''}`}
                />
                {errors.fecha_resolucion && <p className="error-text">{errorMessage(errors.fecha_resolucion)}</p>}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Button type="submit" variant="primary" className="w-full" disabled={esEmergencia}>
                  Aprobar y registrar resolución
                </Button>
              </div>
            </form>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onObservar} className="w-full">
              Observar
            </Button>
            <Button variant="danger" onClick={onRechazar} className="w-full">
              Rechazar
            </Button>
          </div>

          <div className="text-sm text-gray-500 space-y-2">
            <p><strong>Nota:</strong> Al aprobar, se consumirá el saldo del servidor. Para permisos por horas, el código de papeleta se genera automáticamente y podrá imprimirla a continuación.</p>
          </div>
        </div>
      </div>

      <VistaPreviaAdjunto
        idSolicitud={solicitud.id_solicitud}
        adjunto={adjuntoVista}
        onClose={() => setAdjuntoVista(null)}
      />
    </div>
  );
}
