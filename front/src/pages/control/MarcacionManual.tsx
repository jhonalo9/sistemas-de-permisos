import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, useToast } from '@/components/common';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { manualSchema } from '@/utils/validations';
import { FileText } from 'lucide-react';

export default function MarcacionManual() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      codigo: '',
      observacion: '',
    },
  });

  const onSubmit = async (datos: any) => {
    setSubmitting(true);
    try {
      await apiClient<any>('/marcaciones/manual', {
        method: 'POST',
        body: datos,
      });
      toast.success('Marcación manual registrada', 'La marcación se ha registrado correctamente.');
      reset();
    } catch (e: any) {
      toast.error('Error al registrar', e.mensaje);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Marcación manual</h1>
        <p className="text-gray-600">Registre una salida o retorno de forma manual.</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">Datos de la marcación</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="N.º de solicitud (código de la papeleta)"
            {...register('codigo')}
            error={errors.codigo}
          />
          <Input
            label="Observación (obligatoria)"
            {...register('observacion')}
            error={errors.observacion}
          />
          <div className="pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar marcación'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="text-sm text-gray-500">
        <p><strong>Nota:</strong> La marcación manual requiere obligatoriamente una observación. Use esta opción solo cuando el lector de código de barras no esté disponible.</p>
      </div>
    </div>
  );
}
