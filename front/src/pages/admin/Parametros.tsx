import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, useToast } from '@/components/common';

const VACIOS = {
  horaCorte: '17:00',
  lugarExpedicion: 'Chiclayo',
  diasAbandono: '1',
  diasEnfermedad: '3',
};

export default function Parametros() {
  const { toast } = useToast();
  const [valores, setValores] = React.useState(VACIOS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient<any>('/admin/configuracion');
        const filas = res.data || [];
        const buscar = (clave: string) => filas.find((c: any) => c.clave === clave)?.valor;
        setValores({
          horaCorte: buscar('hora_corte_jornada') || VACIOS.horaCorte,
          lugarExpedicion: buscar('lugar_expedicion') || VACIOS.lugarExpedicion,
          diasAbandono: buscar('dias_justificacion_abandono') || VACIOS.diasAbandono,
          diasEnfermedad: buscar('dias_justificacion_enfermedad') || VACIOS.diasEnfermedad,
        });
      } catch (e: any) {
        toast.error('Error al cargar configuración', e.mensaje);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient('/admin/configuracion', {
        method: 'PUT',
        body: {
          hora_corte_jornada: valores.horaCorte,
          lugar_expedicion: valores.lugarExpedicion,
          dias_justificacion_abandono: valores.diasAbandono,
          dias_justificacion_enfermedad: valores.diasEnfermedad,
        },
      });
      toast.success('Configuración guardada', 'Los parámetros del sistema fueron actualizados.');
    } catch (err: any) {
      toast.error('Error al guardar', err.mensaje);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Parámetros del sistema</h1>
        <p className="text-gray-600">Configuración operativa usada por Control de Personal y RRHH.</p>
      </div>

      <Card>
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Hora de corte de jornada"
            type="time"
            value={valores.horaCorte}
            onChange={(e) => setValores({ ...valores, horaCorte: e.target.value })}
            helper="Las salidas sin retorno posteriores a esta hora se muestran como “No volvieron”."
          />
          <Input
            label="Lugar de expedición de la papeleta"
            value={valores.lugarExpedicion}
            onChange={(e) => setValores({ ...valores, lugarExpedicion: e.target.value })}
            helper="Se imprime como lugar de comisión cuando la solicitud no indica uno."
          />
          <Input
            label="Días hábiles para justificar un abandono"
            type="number"
            min={0}
            max={30}
            value={valores.diasAbandono}
            onChange={(e) => setValores({ ...valores, diasAbandono: e.target.value })}
            helper="Plazo que tiene el servidor para presentar el sustento del abandono."
          />
          <Input
            label="Días hábiles para presentar sustento de enfermedad"
            type="number"
            min={0}
            max={30}
            value={valores.diasEnfermedad}
            onChange={(e) => setValores({ ...valores, diasEnfermedad: e.target.value })}
            helper="Plazo para presentar el CITT u otro documento médico."
          />
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
