import React from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/services/api';
import { Button, DropZone, Input, Select, TextArea, useToast } from '@/components/common';
import { asBool, asNum, diasRestantes, esVencida, formatearFecha } from '@/utils/format';
import { AlertTriangle } from 'lucide-react';

interface Props {
  solicitud: any;
  tipos: any[];
  onCompleted: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function FormularioRegularizacion({
  solicitud,
  tipos,
  onCompleted,
  onCancel,
  submitLabel = 'Completar regularización',
}: Props) {
  const { toast } = useToast();
  const [archivos, setArchivos] = React.useState<File[]>([]);
  const [enviando, setEnviando] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<any>({
    defaultValues: {
      id_tipo: '',
      fecha_inicio: '',
      fecha_fin: '',
      hora_inicio: '',
      hora_fin: '',
      cantidad: '',
      motivo: '',
    },
  });

  React.useEffect(() => {
    if (!solicitud) return;
    const tipoEsTemporal = solicitud.tipo_codigo === 'PER_EMERGENCIA';
    reset({
      id_tipo: tipoEsTemporal ? '' : String(solicitud.id_tipo ?? ''),
      fecha_inicio: solicitud.fecha_inicio || '',
      fecha_fin: solicitud.fecha_fin || solicitud.fecha_inicio || '',
      hora_inicio: (solicitud.hora_inicio || '').slice(0, 5),
      hora_fin: (solicitud.hora_fin || '').slice(0, 5),
      cantidad: solicitud.cantidad && Number(solicitud.cantidad) > 0 ? String(solicitud.cantidad) : '',
      motivo: solicitud.motivo || '',
    });
    setArchivos([]);
  }, [solicitud, reset]);

  const idTipoWatch = watch('id_tipo');
  const fechaInicioWatch = watch('fecha_inicio');
  const fechaFinWatch = watch('fecha_fin');
  const horaInicioWatch = watch('hora_inicio');
  const horaFinWatch = watch('hora_fin');

  const tipoSeleccionado = tipos.find((t) => asNum(t.id_tipo) === asNum(idTipoWatch));
  const unidadCantidad = !tipoSeleccionado
    ? ''
    : tipoSeleccionado.unidad_medida === 'HORAS'
      ? 'horas'
      : 'días';

  React.useEffect(() => {
    if (!tipoSeleccionado) {
      setValue('cantidad', '');
      return;
    }

    if (tipoSeleccionado.unidad_medida === 'DIAS') {
      if (!fechaInicioWatch || !fechaFinWatch || fechaFinWatch < fechaInicioWatch) {
        setValue('cantidad', '');
        return;
      }

      const dias = Math.floor(
        (new Date(fechaFinWatch).getTime() - new Date(fechaInicioWatch).getTime()) / 86400000
      ) + 1;
      setValue('cantidad', String(Math.max(1, dias)));
      return;
    }

    if (tipoSeleccionado.unidad_medida === 'HORAS') {
      if (!horaInicioWatch || !horaFinWatch) {
        setValue('cantidad', '');
        return;
      }

      const [hi, mi] = horaInicioWatch.split(':').map(Number);
      const [hf, mf] = horaFinWatch.split(':').map(Number);
      let minutos = hf * 60 + mf - (hi * 60 + mi);
      if (minutos < 0) minutos += 24 * 60;

      setValue('cantidad', minutos > 0 ? String(Math.round((minutos / 60) * 100) / 100) : '');
    }
  }, [
    tipoSeleccionado,
    fechaInicioWatch,
    fechaFinWatch,
    horaInicioWatch,
    horaFinWatch,
    setValue,
  ]);

  const dias = diasRestantes(solicitud?.fecha_limite_regularizacion);
  const vencida = esVencida(solicitud?.fecha_limite_regularizacion);

  const onSubmit = async (datos: any) => {
    if (!datos.id_tipo) {
      toast.error('Tipo requerido', 'Seleccione el tipo definitivo.');
      return;
    }
    if (!datos.fecha_inicio) {
      toast.error('Fecha requerida', 'Indique la fecha de inicio.');
      return;
    }
    if (!datos.motivo || String(datos.motivo).trim().length < 5) {
      toast.error('Motivo requerido', 'El motivo debe tener al menos 5 caracteres.');
      return;
    }

    const tipo = tipos.find((t) => asNum(t.id_tipo) === asNum(datos.id_tipo));
    if (asBool(tipo?.requiere_sustento) && archivos.length === 0) {
      toast.error('Falta sustento', 'Debe adjuntar el documento de sustento del tipo seleccionado.');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('id_tipo', String(asNum(datos.id_tipo)));
      formData.append('fecha_inicio', datos.fecha_inicio);
      formData.append('fecha_fin', datos.fecha_fin || datos.fecha_inicio);
      if (datos.hora_inicio) formData.append('hora_inicio', datos.hora_inicio);
      if (datos.hora_fin) formData.append('hora_fin', datos.hora_fin);
      if (datos.cantidad !== '') formData.append('cantidad', String(asNum(datos.cantidad)));
      formData.append('motivo', datos.motivo);
      archivos.forEach((f) => formData.append('adjuntos', f));

      await apiClient<any>(`/regularizaciones/${solicitud.id_solicitud}/completar`, {
        method: 'POST',
        body: formData,
        useFormData: true,
      });

      toast.success(
        'Regularización completada',
        'La solicitud pasa al flujo normal de aprobación.'
      );
      setArchivos([]);
      onCompleted();
    } catch (e: any) {
      toast.error('Error al completar', e.mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Fecha límite de regularización</p>
            <p className="text-sm text-red-700 mt-1">
              {vencida ? (
                <>La regularización está <strong>VENCIDA</strong>.</>
              ) : (
                <>Quedan {dias} día(s) para regularizar.</>
              )}{' '}
              Límite: {formatearFecha(solicitud?.fecha_limite_regularizacion || '')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Tipo definitivo"
          options={tipos.map((t) => ({ value: t.id_tipo, label: t.nombre }))}
          value={watch('id_tipo') || ''}
          onChange={(e) => setValue('id_tipo', e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Fecha inicio" type="date" {...register('fecha_inicio')} />
          <Input label="Fecha fin" type="date" {...register('fecha_fin')} />
          <Input label="Hora inicio" type="time" {...register('hora_inicio')} />
          <Input label="Hora fin" type="time" {...register('hora_fin')} />
        </div>
        <Input
          label={unidadCantidad ? `Cantidad (${unidadCantidad})` : 'Cantidad'}
          type="number"
          step="0.01"
          {...register('cantidad')}
          readOnly
          className="bg-gray-50 cursor-not-allowed"
          helper="Se calcula automáticamente según las fechas y horas ingresadas."
        />
        <TextArea label="Motivo" {...register('motivo')} rows={3} />
        <DropZone onFilesChange={setArchivos} accept=".pdf,.jpg,.jpeg,.png" />
        {archivos.length === 0 && (
          <p className="helper-text">
            Si el tipo seleccionado requiere sustento, adjunte el documento.
          </p>
        )}

        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
          <Button type="submit" variant="primary" className="w-full" disabled={enviando}>
            {enviando ? 'Guardando...' : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" className="w-full" onClick={onCancel} disabled={enviando}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
