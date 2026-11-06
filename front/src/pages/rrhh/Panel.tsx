import React from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Card, useToast } from '@/components/common';
import { LayoutDashboard, FileText, Clock, AlertTriangle, User, ChevronRight } from 'lucide-react';

const EMPTY_INDICADORES = {
  pendientes_validar: 0,
  emergencias: 0,
  vencidas: 0,
  personal_fuera: 0,
  solicitudes_mes: 0,
};

interface IndicadorCardProps {
  to: string;
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  claseIcono: string;
  claseValor?: string;
}

function IndicadorCard({ to, titulo, valor, icono, claseIcono, claseValor }: IndicadorCardProps) {
  return (
    <Link
      to={to}
      aria-label={`Ir a ${titulo}`}
      className="block group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <Card className="p-5 sm:p-6 card-hover h-full">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-start gap-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">{titulo}</p>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </div>
            <p className={`text-3xl font-bold mt-1 tabular-nums ${claseValor || 'text-text'}`}>
              {valor ?? 0}
            </p>
          </div>
          <div className={`stat-icon ${claseIcono}`}>{icono}</div>
        </div>
      </Card>
    </Link>
  );
}

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
        <IndicadorCard
          to="/rrhh/bandeja"
          titulo="Pendientes de validar"
          valor={ind.pendientes_validar}
          icono={<FileText className="w-5 h-5" />}
          claseIcono="bg-primary-50 text-primary-600"
        />

        <IndicadorCard
          to="/rrhh/regularizaciones"
          titulo="Emergencias por regularizar"
          valor={ind.emergencias}
          icono={<Clock className="w-5 h-5" />}
          claseIcono="bg-amber-50 text-amber-600"
        />

        <IndicadorCard
          to="/rrhh/regularizaciones"
          titulo="Vencidas"
          valor={ind.vencidas}
          icono={<AlertTriangle className="w-5 h-5" />}
          claseIcono="bg-red-50 text-red-600"
          claseValor={(ind.vencidas ?? 0) > 0 ? 'text-red-600' : undefined}
        />

        <IndicadorCard
          to="/control/fuera"
          titulo="Personal fuera ahora"
          valor={ind.personal_fuera}
          icono={<User className="w-5 h-5" />}
          claseIcono="bg-emerald-50 text-emerald-600"
        />

        <IndicadorCard
          to="/rrhh/reportes"
          titulo="Solicitudes del mes"
          valor={ind.solicitudes_mes}
          icono={<LayoutDashboard className="w-5 h-5" />}
          claseIcono="bg-violet-50 text-violet-600"
        />
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
