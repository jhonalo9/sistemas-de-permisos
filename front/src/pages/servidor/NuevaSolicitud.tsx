import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, descargarAdjunto } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, TextArea, DropZone, Card, useToast } from '@/components/common';
import { calcularDiasEntre, calcularHorasEntre, categoriaLabel, unidadLabel, errorMessage, asBool, asNum } from '@/utils/format';
import { AlertTriangle, FileText } from 'lucide-react';

const schema = z
  .object({
    id_tipo: z.coerce.number().int().positive('Seleccione un tipo de solicitud'),
    fecha_inicio: z.string().min(1, 'Fecha de inicio requerida'),
    fecha_fin: z.string().optional(),
    hora_inicio: z.string().optional(),
    hora_fin: z.string().optional(),
    motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
  })
  .superRefine((data, ctx) => {
    // fecha_fin se exige solo si viene vacía y no es permiso de un día (se completa en submit)
    if (!data.fecha_inicio) {
      ctx.addIssue({ code: 'custom', path: ['fecha_inicio'], message: 'Fecha requerida' });
    }
  });

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { id } = useParams();
  const draftId = id ? Number(id) : null;
  const { toast } = useToast();
  const [tipos, setTipos] = React.useState<any[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = React.useState<any>(null);
  const [archivos, setArchivos] = React.useState<File[]>([]);
  const [adjuntosExistentes, setAdjuntosExistentes] = React.useState<any[]>([]);
  const [cantidad, setCantidad] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingDraft, setLoadingDraft] = React.useState(!!draftId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      id_tipo: '',
      fecha_inicio: '',
      fecha_fin: '',
      hora_inicio: '',
      hora_fin: '',
      motivo: '',
    },
  });

  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');
  const horaInicio = watch('hora_inicio');
  const horaFin = watch('hora_fin');
  const idTipo = watch('id_tipo');

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient<any>('/catalogos/tipos');
        const activos = (res.data || []).filter(
          (t: any) => asBool(t.activo) && t.codigo !== 'PER_EMERGENCIA'
        );
        setTipos(activos);

        if (draftId) {
          const dRes = await apiClient<any>(`/solicitudes/${draftId}`);
          const sol = dRes.data;
          if (!sol || sol.estado !== 'BORRADOR') {
            toast.error('Borrador no disponible', 'La solicitud ya no se puede editar como borrador.');
            navigate('/servidor/mis-solicitudes');
            return;
          }
          if (sol.tipo?.codigo === 'PER_EMERGENCIA') {
            toast.error('Tipo no válido', 'La salida de emergencia se registra desde Control de Personal.');
            navigate('/servidor/mis-solicitudes');
            return;
          }

          const tipo = activos.find((t: any) => asNum(t.id_tipo) === asNum(sol.id_tipo)) || sol.tipo || null;
          setTipoSeleccionado(tipo);
          setAdjuntosExistentes(sol.adjuntos || []);
          reset({
            id_tipo: String(sol.id_tipo ?? ''),
            fecha_inicio: sol.fecha_inicio || '',
            fecha_fin: sol.fecha_fin || '',
            hora_inicio: (sol.hora_inicio || '').slice(0, 5),
            hora_fin: (sol.hora_fin || '').slice(0, 5),
            motivo: sol.motivo || '',
          });
        } else {
          setTipoSeleccionado(null);
          setAdjuntosExistentes([]);
          setArchivos([]);
          setCantidad(0);
          reset({
            id_tipo: '',
            fecha_inicio: '',
            fecha_fin: '',
            hora_inicio: '',
            hora_fin: '',
            motivo: '',
          });
        }
      } catch (e: any) {
        toast.error('Error al cargar la solicitud', e?.mensaje);
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [draftId]);

  React.useEffect(() => {
    if (!tipoSeleccionado) {
      setCantidad(0);
      return;
    }
    if (tipoSeleccionado.unidad_medida === 'HORAS' && horaInicio && horaFin) {
      setCantidad(calcularHorasEntre(horaInicio, horaFin));
    } else if (tipoSeleccionado.unidad_medida === 'DIAS' && fechaInicio && fechaFin) {
      setCantidad(calcularDiasEntre(fechaInicio, fechaFin));
    } else if (tipoSeleccionado.categoria === 'PERMISO' && fechaInicio) {
      setCantidad(tipoSeleccionado.unidad_medida === 'HORAS' ? 0 : 1);
    } else {
      setCantidad(0);
    }
  }, [fechaInicio, fechaFin, horaInicio, horaFin, tipoSeleccionado]);

  const requiereSustento = asBool(tipoSeleccionado?.requiere_sustento);
  const tieneSustento = archivos.length > 0 || adjuntosExistentes.length > 0;
  const puedeEnviar =
    !submitting &&
    !!idTipo &&
    !!fechaInicio &&
    (!requiereSustento || tieneSustento);

  const construirFormData = (datos: any, borrador: boolean): FormData => {
    const fechaFinFinal =
      datos.fecha_fin && datos.fecha_fin.length > 0
        ? datos.fecha_fin
        : datos.fecha_inicio;

    const formData = new FormData();
    formData.append('id_tipo', String(datos.id_tipo));
    if (datos.fecha_inicio) formData.append('fecha_inicio', datos.fecha_inicio);
    if (fechaFinFinal) formData.append('fecha_fin', fechaFinFinal);
    if (datos.hora_inicio) formData.append('hora_inicio', datos.hora_inicio);
    if (datos.hora_fin) formData.append('hora_fin', datos.hora_fin);
    if (datos.motivo) formData.append('motivo', datos.motivo);
    if (borrador) formData.append('borrador', '1');
    archivos.forEach((f) => formData.append('adjuntos', f));
    return formData;
  };

  const guardarBorrador = async () => {
    const datos = getValues();
    if (!datos.id_tipo) {
      toast.error('Tipo requerido', 'Seleccione el tipo de solicitud para guardar el borrador.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = construirFormData(datos, true);
      if (draftId) {
        await apiClient<any>(`/solicitudes/${draftId}/borrador`, {
          method: 'POST',
          body: formData,
          useFormData: true,
        });
      } else {
        await apiClient<any>('/solicitudes', {
          method: 'POST',
          body: formData,
          useFormData: true,
        });
      }
      toast.success('Borrador guardado', 'Puede continuar luego desde Mis solicitudes.');
      navigate('/servidor/mis-solicitudes');
    } catch (e: any) {
      toast.error('Error al guardar borrador', e?.mensaje || 'No se pudo guardar el borrador');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (datos: any) => {
    if (requiereSustento && !tieneSustento) {
      toast.error('Falta sustento', 'Debe adjuntar al menos un documento.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = construirFormData(datos, false);

      if (draftId) {
        await apiClient<any>(`/solicitudes/${draftId}/enviar`, {
          method: 'POST',
          body: formData,
          useFormData: true,
        });
      } else {
        await apiClient<any>('/solicitudes', {
          method: 'POST',
          body: formData,
          useFormData: true,
        });
      }

      toast.success('Solicitud enviada', 'Su solicitud ha sido registrada correctamente.');
      navigate('/servidor/mis-solicitudes');
    } catch (e: any) {
      toast.error('Error al enviar', e?.mensaje || 'No se pudo registrar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => {
    toast.error('Formulario incompleto', 'Revise los campos marcados en rojo.');
  };

  if (loadingDraft) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-text-muted">Cargando borrador...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight">
          {draftId ? 'Editar borrador' : 'Nueva solicitud'}
        </h1>
        <p className="text-text-muted mt-1">
          {draftId
            ? 'Complete lo que falte y envíe la solicitud cuando esté listo.'
            : 'Complete los datos de su permiso o licencia. Puede guardar un borrador si aún no tiene todo.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <div>
            <Select
              label="Tipo de permiso o licencia"
              options={tipos.map((t) => ({ value: t.id_tipo, label: t.nombre }))}
              value={idTipo || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value;
                setValue('id_tipo', val ? Number(val) : '', { shouldValidate: true });
                const t = tipos.find((x) => String(x.id_tipo) === String(val));
                setTipoSeleccionado(t || null);
              }}
              error={errors.id_tipo}
            />
            {tipos.length === 0 && (
              <p className="helper-text">No hay tipos activos. Un administrador debe crearlos en el catálogo.</p>
            )}
            {tipoSeleccionado && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Categoría:</span>
                  <span className="font-medium">{categoriaLabel(tipoSeleccionado.categoria)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Con goce:</span>
                  <span className="font-medium">{asBool(tipoSeleccionado.con_goce) ? 'Sí' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Unidad:</span>
                  <span className="font-medium">{unidadLabel(tipoSeleccionado.unidad_medida)}</span>
                </div>
                {tipoSeleccionado.max_por_solicitud != null && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tope por solicitud:</span>
                    <span className="font-medium">
                      {tipoSeleccionado.max_por_solicitud} {unidadLabel(tipoSeleccionado.unidad_medida)}
                    </span>
                  </div>
                )}
                {tipoSeleccionado.base_legal && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted shrink-0">Base legal:</span>
                    <span className="font-medium text-xs text-right">{tipoSeleccionado.base_legal}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {tipoSeleccionado && tipoSeleccionado.categoria === 'LICENCIA' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Fecha de inicio" type="date" {...register('fecha_inicio')} error={errors.fecha_inicio} />
              <Input label="Fecha fin" type="date" {...register('fecha_fin')} error={errors.fecha_fin} />
            </div>
          )}

          {tipoSeleccionado && tipoSeleccionado.categoria === 'PERMISO' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Fecha" type="date" {...register('fecha_inicio')} error={errors.fecha_inicio} />
              {tipoSeleccionado.unidad_medida === 'HORAS' && (
                <>
                  <div>
                    <label className="label">Hora de salida</label>
                    <input {...register('hora_inicio')} type="time" className="input-field" />
                    {errorMessage(errors.hora_inicio) && (
                      <p className="error-text">{errorMessage(errors.hora_inicio)}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Hora de retorno</label>
                    <input {...register('hora_fin')} type="time" className="input-field" />
                    {errorMessage(errors.hora_fin) && (
                      <p className="error-text">{errorMessage(errors.hora_fin)}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {tipoSeleccionado && (
            <div>
              <label className="label">Cantidad calculada</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-text tabular-nums">{cantidad}</span>
                <span className="text-sm text-text-muted">{unidadLabel(tipoSeleccionado.unidad_medida)}</span>
              </div>
              {cantidad > 0 &&
                tipoSeleccionado.max_por_solicitud != null &&
                cantidad > Number(tipoSeleccionado.max_por_solicitud) && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    Alerta: excede el tope máximo de {tipoSeleccionado.max_por_solicitud} por solicitud.
                  </p>
                )}
            </div>
          )}

          <TextArea label="Motivo" {...register('motivo')} rows={4} error={errors.motivo} />

          {requiereSustento && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Documento de sustento obligatorio</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Este tipo de solicitud requiere adjuntar un documento de sustento (certificado médico,
                    invitación, etc.).
                  </p>
                </div>
              </div>
            </div>
          )}

          {adjuntosExistentes.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-border space-y-2">
              <p className="text-sm font-semibold text-text">Adjuntos del borrador</p>
              {adjuntosExistentes.map((a) => (
                <div key={a.id_adjunto} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-text">
                    <FileText className="w-4 h-4 text-gray-400" />
                    {a.nombre_arch}
                  </span>
                  <button
                    type="button"
                    onClick={() => descargarAdjunto(draftId as number, a.id_adjunto, a.nombre_arch).catch((e: any) => toast.error('No se pudo descargar', e?.mensaje || 'Error'))}
                    className="text-primary hover:underline"
                  >
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          )}

          <DropZone onFilesChange={setArchivos} accept=".pdf,.jpg,.jpeg,.png" className="mb-2" />
          {requiereSustento && !tieneSustento && (
            <p className="error-text">Debe adjuntar al menos un documento de sustento.</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => navigate('/servidor')}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={guardarBorrador}
              disabled={!idTipo || submitting}
            >
              {submitting ? 'Procesando...' : 'Guardar borrador'}
            </Button>
            <Button type="submit" variant="primary" disabled={!puedeEnviar}>
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
