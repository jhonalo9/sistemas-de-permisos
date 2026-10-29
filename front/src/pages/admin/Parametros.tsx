import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, useToast } from '@/components/common';

export default function Parametros() {
  const { toast } = useToast();
  const [horaCorte, setHoraCorte] = React.useState('17:00');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient<any>('/admin/configuracion');
        const fila = (res.data || []).find((c: any) => c.clave === 'hora_corte_jornada');
        if (fila?.valor) setHoraCorte(fila.valor);
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
        body: { hora_corte_jornada: horaCorte },
      });
      toast.success('Configuración guardada', 'La hora de corte fue actualizada.');
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
        <p className="text-gray-600">Configuración operativa usada por Control de Personal.</p>
      </div>

      <Card>
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Hora de corte de jornada"
            type="time"
            value={horaCorte}
            onChange={(e) => setHoraCorte(e.target.value)}
            helper="Las salidas sin retorno posteriores a esta hora se muestran como “No volvieron”."
          />
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
