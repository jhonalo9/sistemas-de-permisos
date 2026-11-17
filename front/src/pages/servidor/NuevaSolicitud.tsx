import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, descargarAdjunto } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, TextArea, DropZone, Card, ProgressBar, useToast } from '@/components/common';
import { calcularDiasEntre, categoriaLabel, unidadLabel, asBool, asNum } from '@/utils/format';
import { AlertTriangle, CalendarDays, Clock, FileText } from 'lucide-react';

const schema = z
  .object({
    id_tipo: z.coerce.number().int().positive('Seleccione un tipo de solicitud'),
    fecha_inicio: z.string().min(1, 'Fecha de inicio requerida'),
    fecha_fin: z.string().optional(),
    hora_inicio: z.string().optional(),
    hora_fin: z.string().optional(),
    motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
    con_retorno: z.boolean().optional(),
    entrega_cargo: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // fecha_fin se exige solo si viene vacía y no es permiso de un día (se completa en submit)
    if (!data.fecha_inicio) {
      ctx.addIssue({ code: 'custom', path: ['fecha_inicio'], message: 'Fecha requerida' });
    }
  });

interface NuevaSolicitudProps {
  embedded?: boolean;
  onClose?: () => void;
}

function hoyISO(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

function sumarDiasFecha(fecha: string, dias: number, calendario: boolean): string {
  const total = Math.ceil(Number(dias) || 0);
  if (total <= 0) return fecha;

  const cursor = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(cursor.getTime())) return fecha;

  let sumados = 0;
  while (sumados < total) {
    cursor.setDate(cursor.getDate() + 1);
    if (calendario) {
      sumados++;
      continue;
    }
    const dow = cursor.getDay();
    if (dow === 0 || dow === 6) continue;
    sumados++;
  }

  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
}

export default function NuevaSolicitud({ embedded = false, onClose }: NuevaSolicitudProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const draftId = id ? Number(id) : null;
  const { toast } = useToast();
  const [tipos, setTipos] = React.useState<any[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = React.useState<any>(null);
  const [archivos, setArchivos] = React.useState<File[]>([]);
  const [adjuntosExistentes, setAdjuntosExistentes] = React.useState<any[]>([]);
  const [cantidad, setCantidad] = React.useState(0);
  const [condicionesSel, setCondicionesSel] = React.useState<any[]>([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = React.useState<'HORAS' | 'DIAS' | null>(null);
  const [usoMensual, setUsoMensual] = React.useState<any[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingDraft, setLoadingDraft] = React.useState(!!draftId);

  const cerrar = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/servidor');
    }
  };

  const finalizar = () => {
    onClose?.();
    navigate('/servidor/mis-solicitudes');
  };

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
      fecha_inicio: hoyISO(),
      fecha_fin: hoyISO(),
      hora_inicio: '',
      hora_fin: '',
      motivo: '',
      lugar_comision: '',
      con_retorno: true,
      entrega_cargo: false,
    },
  });

  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');
  const idTipo = watch('id_tipo');
  const entregaCargo = watch('entrega_cargo');
  const conRetorno = watch('con_retorno');

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
            onClose?.();
            navigate('/servidor/mis-solicitudes');
            return;
          }
          if (sol.tipo?.codigo === 'PER_EMERGENCIA') {
            toast.error('Tipo no válido', 'La salida de emergencia se registra desde Control de Personal.');
            onClose?.();
            navigate('/servidor/mis-solicitudes');
            return;
          }

          const tipo = activos.find((t: any) => asNum(t.id_tipo) === asNum(sol.id_tipo)) || sol.tipo || null;
          setTipoSeleccionado(tipo);
          setUnidadSeleccionada(tipo?.unidad_medida || sol.tipo?.unidad_medida || null);
          setAdjuntosExistentes(sol.adjuntos || []);
          setCondicionesSel(
            (tipo?.condiciones || []).filter((c: any) =>
              (sol.condiciones || []).some((sc: any) => asNum(sc.id_condicion) === asNum(c.id_condicion))
            )
          );
          reset({
            id_tipo: String(sol.id_tipo ?? ''),
            fecha_inicio: sol.fecha_inicio || '',
            fecha_fin: sol.fecha_fin_base || sol.fecha_fin || '',
            hora_inicio: (sol.hora_inicio || '').slice(0, 5),
            hora_fin: (sol.hora_fin || '').slice(0, 5),
            motivo: sol.motivo || '',
            lugar_comision: sol.lugar_comision || '',
            con_retorno: sol.con_retorno == null ? true : asBool(sol.con_retorno),
            entrega_cargo: asBool(sol.entrega_cargo),
          });
        } else {
          setTipoSeleccionado(null);
          setUnidadSeleccionada(null);
          setAdjuntosExistentes([]);
          setArchivos([]);
          setCantidad(0);
          setCondicionesSel([]);
          reset({
            id_tipo: '',
            fecha_inicio: hoyISO(),
            fecha_fin: hoyISO(),
            hora_inicio: '',
            hora_fin: '',
            motivo: '',
            lugar_comision: '',
            con_retorno: true,
            entrega_cargo: false,
          });
        }
      } catch (e: any) {
        toast.error('Error al cargar la solicitud', e?.mensaje);
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [draftId]);

  const condicionesDisponibles = (tipoSeleccionado?.condiciones || []).filter((c: any) => asBool(c.activo));
  const diasExtra = condicionesSel.reduce((acc: number, c: any) => acc + Number(c.dias_extra || 0), 0);

  const periodoUso = (fechaInicio || hoyISO()).slice(0, 7);

  React.useEffect(() => {
    let activo = true;
    const [anioUso, mesUso] = periodoUso.split('-');

    (async () => {
      try {
        const res = await apiClient<any>(`/saldos/mensuales?anio=${anioUso}&mes=${mesUso}`);
        if (activo) setUsoMensual(res.data || []);
      } catch {
        if (activo) setUsoMensual([]);
      }
    })();

    return () => {
      activo = false;
    };
  }, [periodoUso]);

  const usoSeleccionado = usoMensual.find((u) => asNum(u.id_tipo) === asNum(idTipo));
  const limiteUso = usoSeleccionado?.max_solicitudes_mes ?? null;
  const porcentajeUso =
    limiteUso !== null && Number(limiteUso) > 0
      ? Math.min(100, (Number(usoSeleccionado?.usadas || 0) / Number(limiteUso)) * 100)
      : 0;
  const colorUso = usoSeleccionado?.alcanzado
    ? 'bg-red-500'
    : porcentajeUso >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const topeAnualUso = usoSeleccionado?.asignado_anual ?? null;
  const usadoAnualUso = Number(usoSeleccionado?.usado_anual || 0);
  const porcentajeAnualUso =
    topeAnualUso !== null && Number(topeAnualUso) > 0
      ? Math.min(100, (usadoAnualUso / Number(topeAnualUso)) * 100)
      : 0;
  const colorAnualUso = usoSeleccionado?.alcanzado_anual
    ? 'bg-red-500'
    : porcentajeAnualUso >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const fechaFinEfectiva = React.useMemo(() => {
    if (!fechaFin) return fechaFin;
    let f = fechaFin;
    condicionesSel.forEach((c: any) => {
      f = sumarDiasFecha(f, Number(c.dias_extra || 0), asBool(c.dias_calendario));
    });
    return f;
  }, [fechaFin, condicionesSel]);

  React.useEffect(() => {
    if (!tipoSeleccionado) {
      setCantidad(0);
      return;
    }
    if (tipoSeleccionado.unidad_medida === 'HORAS') {
      // La duración real la registra Control de Personal.
      setCantidad(0);
    } else if (tipoSeleccionado.unidad_medida === 'DIAS' && fechaInicio && fechaFin) {
      setCantidad(calcularDiasEntre(fechaInicio, fechaFin) + diasExtra);
    } else if (tipoSeleccionado.categoria === 'PERMISO' && fechaInicio) {
      setCantidad(1 + diasExtra);
    } else {
      setCantidad(0);
    }
  }, [fechaInicio, fechaFin, diasExtra, tipoSeleccionado]);

  const alternarCondicion = (condicion: any) => {
    setCondicionesSel((prev) => {
      const ya = prev.some((c) => asNum(c.id_condicion) === asNum(condicion.id_condicion));
      if (ya) return prev.filter((c) => asNum(c.id_condicion) !== asNum(condicion.id_condicion));
      const sinGrupo = condicion.grupo
        ? prev.filter((c) => c.grupo !== condicion.grupo)
        : prev;
      return [...sinGrupo, condicion];
    });
  };

  const tiposDisponibles = React.useMemo(() => {
    const lista = tipos.filter((t) => t.unidad_medida === unidadSeleccionada);
    if (
      tipoSeleccionado &&
      !lista.some((t) => asNum(t.id_tipo) === asNum(tipoSeleccionado.id_tipo))
    ) {
      return [...lista, tipoSeleccionado];
    }
    return lista;
  }, [tipos, unidadSeleccionada, tipoSeleccionado]);

  const reiniciarTipo = () => {
    setValue('id_tipo', '', { shouldValidate: false });
    setValue('fecha_inicio', hoyISO(), { shouldValidate: false });
    setValue('fecha_fin', hoyISO(), { shouldValidate: false });
    setValue('hora_inicio', '', { shouldValidate: false });
    setValue('hora_fin', '', { shouldValidate: false });
    setValue('lugar_comision', '', { shouldValidate: false });
    setValue('con_retorno', true, { shouldValidate: false });
    setValue('entrega_cargo', false, { shouldValidate: false });
    setTipoSeleccionado(null);
    setCondicionesSel([]);
    setCantidad(0);
  };

  const elegirUnidad = (unidad: 'HORAS' | 'DIAS') => {
    setUnidadSeleccionada(unidad);
    reiniciarTipo();
  };

  const cambiarUnidad = () => {
    setUnidadSeleccionada(null);
    reiniciarTipo();
  };

  const requiereSustento =
    tipoSeleccionado?.unidad_medida !== 'HORAS' && asBool(tipoSeleccionado?.requiere_sustento);
  const tieneSustento = archivos.length > 0 || adjuntosExistentes.length > 0;
  const requiereEntregaCargo =
    tipoSeleccionado?.categoria === 'LICENCIA' &&
    tipoSeleccionado?.unidad_medida === 'DIAS' &&
    asBool(tipoSeleccionado?.requiere_entrega_cargo) &&
    Number(cantidad) >= 20;
  const puedeEnviar =
    !submitting &&
    !!idTipo &&
    !!fechaInicio &&
    (!requiereSustento || tieneSustento) &&
    (!requiereEntregaCargo || !!entregaCargo);

  const construirFormData = (datos: any, borrador: boolean): FormData => {
    const fechaFinFinal =
      tipoSeleccionado?.unidad_medida === 'HORAS'
        ? datos.fecha_inicio
        : datos.fecha_fin && datos.fecha_fin.length > 0
          ? datos.fecha_fin
          : datos.fecha_inicio;

    const formData = new FormData();
    formData.append('id_tipo', String(datos.id_tipo));
    if (datos.fecha_inicio) formData.append('fecha_inicio', datos.fecha_inicio);
    if (fechaFinFinal) formData.append('fecha_fin', fechaFinFinal);
    if (datos.hora_inicio) formData.append('hora_inicio', datos.hora_inicio);
    if (datos.hora_fin) formData.append('hora_fin', datos.hora_fin);
    if (datos.motivo) formData.append('motivo', datos.motivo);
    if (datos.lugar_comision) formData.append('lugar_comision', datos.lugar_comision);
    if (tipoSeleccionado?.unidad_medida === 'HORAS') {
      formData.append('con_retorno', conRetorno ? '1' : '0');
    }
    if (condicionesSel.length > 0) {
      formData.append('condiciones', condicionesSel.map((c) => c.id_condicion).join(','));
    }
    formData.append('entrega_cargo', datos.entrega_cargo ? '1' : '0');
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
      finalizar();
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
      finalizar();
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

  if (!unidadSeleccionada) {
    const conteoHoras = tipos.filter((t) => t.unidad_medida === 'HORAS').length;
    const conteoDias = tipos.filter((t) => t.unidad_medida === 'DIAS').length;

    return (
      <div className={embedded ? 'w-full' : 'max-w-3xl mx-auto space-y-6'}>
        {!embedded && (
          <div>
            <h1 className="text-2xl font-bold text-text tracking-tight">Nueva solicitud</h1>
            <p className="text-text-muted mt-1">
              Primero elija cómo se medirá su permiso o licencia.
            </p>
          </div>
        )}

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-text">
                ¿Cómo se medirá su solicitud?
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Elija una opción para mostrar solo los tipos de solicitud compatibles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => elegirUnidad('HORAS')}
                className="group text-left p-5 rounded-2xl border-2 border-border bg-card hover:border-primary-400 hover:bg-primary-50/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-lg font-semibold text-text">PAPELETA</p>
                <p className="text-sm text-text-muted mt-1">
                  Permiso por horas: Salida y retorno el mismo día. Ideal para trámites, salud o asuntos personales.
                </p>
                <p className="text-xs font-medium text-primary-600 mt-4">
                  {conteoHoras} tipo(s) disponible(s)
                </p>
              </button>

              <button
                type="button"
                onClick={() => elegirUnidad('DIAS')}
                className="group text-left p-5 rounded-2xl border-2 border-border bg-card hover:border-primary-400 hover:bg-primary-50/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <p className="text-lg font-semibold text-text">Licencia o permiso por días</p>
                <p className="text-sm text-text-muted mt-1">
                  Solicitudes que abarcan días completos, con fechas de inicio y fin.
                </p>
                <p className="text-xs font-medium text-primary-600 mt-4">
                  {conteoDias} tipo(s) disponible(s)
                </p>
              </button>
            </div>

            <p className="text-center text-xs text-text-muted">
              Podrá cambiar esta opción antes de enviar la solicitud.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={embedded ? 'w-full' : 'max-w-3xl mx-auto space-y-6'}>
      {!embedded && (
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
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-border">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                {unidadSeleccionada === 'HORAS' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <CalendarDays className="w-4 h-4" />
                )}
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  Tipo de solicitud
                </p>
                <p className="text-sm font-semibold text-text">
                  {unidadSeleccionada === 'HORAS'
                    ? 'Permiso por horas'
                    : 'Licencia o permiso por días'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={cambiarUnidad}
              className="text-sm font-medium text-primary-600 hover:underline self-start sm:self-auto"
            >
              Cambiar a {unidadSeleccionada === 'HORAS' ? 'días' : 'horas'}
            </button>
          </div>

          <div>
            <Select
              label="Tipo de permiso o licencia"
              options={tiposDisponibles.map((t) => ({ value: t.id_tipo, label: t.nombre }))}
              value={idTipo || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value;
                setValue('id_tipo', val ? Number(val) : '', { shouldValidate: true });
                const t = tiposDisponibles.find((x) => String(x.id_tipo) === String(val));
                setTipoSeleccionado(t || null);
                setCondicionesSel([]);
              }}
              error={errors.id_tipo}
            />
            {tipoSeleccionado && usoSeleccionado && (
              <div
                className={`mt-2 rounded-xl border p-4 ${
                  (limiteUso !== null && usoSeleccionado.alcanzado) ||
                  (limiteUso === null && usoSeleccionado.alcanzado_anual)
                    ? 'border-red-200 bg-red-50'
                    : 'border-border bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-text">
                    {limiteUso !== null
                      ? 'Uso mensual'
                      : topeAnualUso !== null
                        ? 'Uso anual'
                        : 'Uso del tipo'}
                  </p>
                  {limiteUso !== null ? (
                    <span
                      className={`text-sm font-bold ${
                        usoSeleccionado.alcanzado ? 'text-red-600' : 'text-text'
                      }`}
                    >
                      {usoSeleccionado.usadas} / {limiteUso}
                    </span>
                  ) : topeAnualUso !== null ? (
                    <span
                      className={`text-xs font-bold ${
                        usoSeleccionado.alcanzado_anual ? 'text-red-600' : 'text-text'
                      }`}
                    >
                      {usadoAnualUso} / {topeAnualUso} {unidadLabel(usoSeleccionado.unidad_medida)}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-text-muted">
                      Sin tope mensual ni anual
                    </span>
                  )}
                </div>

                {limiteUso !== null ? (
                  <>
                    <ProgressBar
                      valor={Number(usoSeleccionado.usadas || 0)}
                      maximo={Number(limiteUso)}
                      className="h-3"
                      color={colorUso}
                    />
                    {/*<div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white/70 border border-border/60 p-2">
                        <p className="text-xs text-text-muted uppercase">Tope</p>
                        <p className="text-base font-bold text-text">{limiteUso}</p>
                      </div>
                      <div className="rounded-lg bg-white/70 border border-border/60 p-2">
                        <p className="text-xs text-text-muted uppercase">Usadas</p>
                        <p className="text-base font-bold text-text">{usoSeleccionado.usadas}</p>
                      </div>
                      <div className="rounded-lg bg-white/70 border border-border/60 p-2">
                        <p className="text-xs text-text-muted uppercase">Disponibles</p>
                        <p
                          className={`text-base font-bold ${
                            usoSeleccionado.alcanzado ? 'text-red-600' : 'text-text'
                          }`}
                        >
                          {usoSeleccionado.disponibles ?? 0}
                        </p>
                      </div>
                    </div>*/}
                    <p className="mt-2 text-xs text-text-muted">
                      El conteo solo incluye solicitudes aprobadas.
                    </p>
                    {usoSeleccionado.alcanzado && (
                      <p className="mt-2 text-sm font-semibold text-red-700">
                        Alcanzaste el tope mensual de este tipo.
                      </p>
                    )}
                  </>
                ) : topeAnualUso !== null ? (
                  <>
                    <ProgressBar
                      valor={usadoAnualUso}
                      maximo={Number(topeAnualUso)}
                      className="h-3"
                      color={colorAnualUso}
                    />
                    {/*<div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white/70 border border-border/60 p-2">
                        <p className="text-xs text-text-muted uppercase">Tope anual</p>
                        <p className="text-sm font-bold text-text">
                          {topeAnualUso} {unidadLabel(usoSeleccionado.unidad_medida)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/70 border border-border/60 p-2">
                        <p className="text-xs text-text-muted uppercase">Usado</p>
                        <p className="text-sm font-bold text-text">
                          {usadoAnualUso} {unidadLabel(usoSeleccionado.unidad_medida)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/70 border border-border/60 p-2">
                        <p className="text-xs text-text-muted uppercase">Disponible</p>
                        <p
                          className={`text-sm font-bold ${
                            usoSeleccionado.alcanzado_anual ? 'text-red-600' : 'text-text'
                          }`}
                        >
                          {usoSeleccionado.disponible_anual ?? 0}{' '}
                          {unidadLabel(usoSeleccionado.unidad_medida)}
                        </p>
                      </div>
                    </div>*/}
                    <p className="mt-2 text-xs text-text-muted">
                      Este tipo no tiene tope mensual; se muestra su tope anual.
                    </p>
                    {usoSeleccionado.alcanzado_anual && (
                      <p className="mt-2 text-sm font-semibold text-red-700">
                        Alcanzaste el tope anual de este tipo.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-white/70 border border-border/60 px-3 py-2">
                    <span className="text-sm text-text-muted">Solicitudes usadas este mes</span>
                    <span className="text-sm font-bold text-text">{usoSeleccionado.usadas}</span>
                  </div>
                )}
              </div>
            )}
            {tiposDisponibles.length === 0 && (
              <p className="helper-text">
                No hay tipos activos para esta unidad. Un administrador debe crearlos en el catálogo.
              </p>
            )}
            {/*{tipoSeleccionado && (
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
                {Number(tipoSeleccionado.dias_anticipacion) > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted shrink-0">Anticipación:</span>
                    <span className="font-medium text-right">
                      {tipoSeleccionado.dias_anticipacion}{' '}
                      {asBool(tipoSeleccionado.anticipacion_dias_habiles) ? 'día(s) hábil(es)' : 'día(s) calendario'}
                    </span>
                  </div>
                )}
                {tipoSeleccionado.max_solicitudes_mes != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted shrink-0">Máx. por mes:</span>
                    <span className="font-medium text-right">{tipoSeleccionado.max_solicitudes_mes} solicitud(es)</span>
                  </div>
                )}
                {tipoSeleccionado.tipo_sustento && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted shrink-0">Sustento:</span>
                    <span className="font-medium text-xs text-right">{tipoSeleccionado.tipo_sustento}</span>
                  </div>
                )}
              </div>
            )}*/}
          </div>

          {condicionesDisponibles.length > 0 && (
            <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100 space-y-3">
              <div>
                <p className="font-semibold text-text">Condiciones especiales</p>
                <p className="text-sm text-text-muted">
                  Marque si su caso corresponde a alguna condición. Los días adicionales se suman al plazo.
                </p>
              </div>
              <div className="space-y-2">
                {condicionesDisponibles.map((c: any) => (
                  <label key={c.id_condicion} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary-500"
                      checked={condicionesSel.some((s) => asNum(s.id_condicion) === asNum(c.id_condicion))}
                      onChange={() => alternarCondicion(c)}
                    />
                    <span className="text-sm text-text">
                      {c.nombre}
                      <span className="text-text-muted">
                        {' '}(+{Number(c.dias_extra)} {asBool(c.dias_calendario) ? 'día(s) calendario' : 'día(s) hábil(es)'})
                      </span>
                      {c.descripcion && (
                        <span className="block text-xs text-text-muted">{c.descripcion}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {diasExtra > 0 && fechaFin && (
                <p className="text-sm text-primary-700">
                  Fecha fin con extensión: <strong>{fechaFinEfectiva}</strong> (+{diasExtra} día(s)).
                </p>
              )}
            </div>
          )}

          {asBool(tipoSeleccionado?.ajustar_siguiente_habil) && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Si la fecha elegida cae en un día no laborable, se trasladará automáticamente al siguiente día hábil.
            </p>
          )}

          {tipoSeleccionado && tipoSeleccionado.categoria === 'LICENCIA' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Fecha de inicio" type="date" {...register('fecha_inicio')} error={errors.fecha_inicio} />
              <Input label="Fecha fin" type="date" {...register('fecha_fin')} error={errors.fecha_fin} />
            </div>
          )}

          {tipoSeleccionado && tipoSeleccionado.categoria === 'PERMISO' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Fecha" type="date" {...register('fecha_inicio')} error={errors.fecha_inicio} />
              </div>
              {tipoSeleccionado.unidad_medida === 'HORAS' && (
                <div>
                  <label className="label">¿El servidor retornará?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('con_retorno', true, { shouldValidate: true })}
                      className={`text-left p-4 rounded-xl border-2 transition-colors ${
                        conRetorno
                          ? 'border-primary-500 bg-primary-50/70'
                          : 'border-border bg-card hover:border-primary-300'
                      }`}
                    >
                      <p className="font-semibold text-text">Con retorno</p>
                      <p className="text-sm text-text-muted mt-1">
                        Control registrará la salida y el retorno.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('con_retorno', false, { shouldValidate: true })}
                      className={`text-left p-4 rounded-xl border-2 transition-colors ${
                        !conRetorno
                          ? 'border-primary-500 bg-primary-50/70'
                          : 'border-border bg-card hover:border-primary-300'
                      }`}
                    >
                      <p className="font-semibold text-text">Sin retorno</p>
                      <p className="text-sm text-text-muted mt-1">
                        Control registrará la salida y cerrará el permiso manualmente.
                      </p>
                    </button>
                  </div>
                  <p className="helper-text">
                    Las horas reales de salida y retorno serán registradas por Control de Personal.
                  </p>
                </div>
              )}
            </div>
          )}

          {tipoSeleccionado && tipoSeleccionado.unidad_medida === 'HORAS' ? (
            <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-4">
              <p className="text-sm font-semibold text-text">Duración pendiente de Control</p>
              <p className="text-sm text-text-muted mt-1">
                El saldo se calculará con las horas reales de salida y retorno.
              </p>
            </div>
          ) : tipoSeleccionado && (
            <div>
              <label className="label">Cantidad calculada</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-text tabular-nums">{cantidad}</span>
                <span className="text-sm text-text-muted">{unidadLabel(tipoSeleccionado.unidad_medida)}</span>
              </div>
              {cantidad > 0 &&
                tipoSeleccionado.max_por_solicitud != null &&
                cantidad - diasExtra > Number(tipoSeleccionado.max_por_solicitud) && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    Alerta: excede el tope máximo de {tipoSeleccionado.max_por_solicitud} por solicitud.
                  </p>
                )}
              {diasExtra > 0 && (
                <p className="mt-1 text-xs text-text-muted">
                  Incluye {diasExtra} día(s) adicional(es) por condiciones especiales.
                </p>
              )}
            </div>
          )}

          <TextArea label="Motivo" {...register('motivo')} rows={4} error={errors.motivo} />

          {tipoSeleccionado?.codigo === 'PER_COMISION_SERVICIO' && (
            <Input
              label="Lugar de comisión"
              placeholder="Ciudad o sede donde se realizará la comisión"
              {...register('lugar_comision')}
            />
          )}

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
          {tipoSeleccionado?.unidad_medida === 'HORAS' && (
            <p className="helper-text">
              La evidencia es opcional en permisos por horas. Puede adjuntarla si desea respaldar su solicitud.
            </p>
          )}
          {requiereSustento && !tieneSustento && (
            <p className="error-text">Debe adjuntar al menos un documento de sustento.</p>
          )}

          {requiereEntregaCargo && (
            <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-border cursor-pointer">
              <input
                type="checkbox"
                {...register('entrega_cargo')}
                className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text">
                Declaro haber realizado la entrega de cargo a mi jefe inmediato, conforme al
                artículo 32 del Reglamento Interno.
              </span>
            </label>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={cerrar}>
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
