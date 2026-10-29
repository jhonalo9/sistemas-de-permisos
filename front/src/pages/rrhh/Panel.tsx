import React from 'react';
import { apiClient } from '@/services/api';
import { Card, useToast } from '@/components/common';
import { LayoutDashboard, FileText, Clock, AlertTriangle, User } from 'lucide-react';

const EMPTY_INDICADORES = {
  pendientes_validar: 0,
  emergencias: 0,
  vencidas: 0,
  personal_fuera: 0,
  solicitudes_mes: 0,
};

export default function Panel() {
  const { toast } = useToast();
  const [indicadores, setIndicadores] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient<any>('/rrhh/panel');
        // Acepta data anidada o el objeto plano de la respuesta
        const data = res?.data ?? (res && typeof res === 'object' && 'pendientes_validar' in res ? res : null);
        setIndicadores(data || EMPTY_INDICADORES);
      } catch (e: any) {
        setError(e?.mensaje || 'No se pudieron cargar los indicadores');
        setIndicadores(EMPTY_INDICADORES);
        toast.error('Error al cargar indicadores', e?.mensaje);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []); // mount only

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="mt-4 text-sm text-text-muted">Cargando panel...</p>
      </div>
    );
  }

  const ind = indicadores || EMPTY_INDICADORES;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight">Panel de indicadores</h1>
        <p className="text-text-muted mt-1">Resumen del estado actual de solicitudes y personal.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}. Se muestran valores en cero hasta que el backend responda.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Pendientes de validar</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{ind.pendientes_validar ?? 0}</p>
            </div>
            <div className="stat-icon bg-primary-50 text-primary-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Emergencias por regularizar</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{ind.emergencias ?? 0}</p>
            </div>
            <div className="stat-icon bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Vencidas</p>
              <p className={`text-3xl font-bold mt-1 tabular-nums ${(ind.vencidas ?? 0) > 0 ? 'text-red-600' : 'text-text'}`}>
                {ind.vencidas ?? 0}
              </p>
            </div>
            <div className="stat-icon bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Personal fuera ahora</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{ind.personal_fuera ?? 0}</p>
            </div>
            <div className="stat-icon bg-emerald-50 text-emerald-600">
              <User className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 card-hover">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Solicitudes del mes</p>
              <p className="text-3xl font-bold text-text mt-1 tabular-nums">{ind.solicitudes_mes ?? 0}</p>
            </div>
            <div className="stat-icon bg-violet-50 text-violet-600">
              <LayoutDashboard className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {(ind.vencidas ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                Hay {ind.vencidas} emergencia(s) vencida(s) de regularización
              </p>
              <p className="text-sm text-red-700 mt-1">
                Revise la bandeja de regularizaciones para atenderlas cuanto antes.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
