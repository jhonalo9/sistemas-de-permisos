import React, { useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Card, ProgressBar, useToast } from '@/components/common';
import { unidadLabel } from '@/utils/format';
import { Wallet, Clock, CheckCircle2 } from 'lucide-react';

export default function MisSaldos() {
  const { toast } = useToast();
  const [saldos, setSaldos] = React.useState<any[]>([]);
  const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
  const [loading, setLoading] = React.useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>(`/saldos/mios?anio=${anio}`);
      setSaldos(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar saldos', e.mensaje);
    } finally {
      setLoading(false);
    }
  }, [anio]);

  React.useEffect(() => {
    cargar();
  }, [anio]); // mount/anio

  const iconos: Record<string, any> = { LICENCIA: Wallet, PERMISO: Clock };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis saldos</h1>
        <p className="text-gray-600">Consulte el uso de sus permisos y licencias del año.</p>
      </div>

      <div className="flex gap-3">
        <select
          value={anio}
          onChange={(e) => setAnio(e.target.value)}
          className="input-field"
        >
          {[2024, 2025, 2026, 2027].map((a) => (
            <option key={a} value={String(a)}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : saldos.length > 0 ? (
        <div className="space-y-4">
          {saldos.map((s) => {
            const Icon = iconos[s.tipo?.categoria] || CheckCircle2;
            const disponible = s.asignado - s.usado;
            const porcentaje = s.asignado > 0 ? Math.min((s.usado / s.asignado) * 100, 100) : 0;
            return (
              <Card key={s.id_saldo} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-text">{s.tipo?.nombre}</p>
                      <p className="text-xs text-gray-500">{unidadLabel(s.tipo?.unidad_medida || 'DIAS')} • Año {s.anio}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-text ${porcentaje > 80 ? 'text-red-600' : ''}`}>
                    {disponible} disponible
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Asignado</p>
                    <p className="font-medium text-text">{s.asignado}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Usado</p>
                    <p className="font-medium text-text">{s.usado}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Disponible</p>
                    <p className="font-medium text-text">{disponible}</p>
                  </div>
                </div>
                <ProgressBar valor={s.usado} maximo={s.asignado} className="h-3" />
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p>No hay saldos registrados para este año.</p>
        </div>
      )}
    </div>
  );
}
