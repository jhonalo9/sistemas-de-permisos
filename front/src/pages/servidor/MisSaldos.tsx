import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, ProgressBar, useToast } from '@/components/common';
import GraficoSemicirculo from '@/components/saldos/GraficoSemicirculo';
import { estadoLabel, formatearCantidad, unidadLabel } from '@/utils/format';
import { Wallet, Clock, CalendarDays, AlertTriangle, BarChart3, LayoutGrid } from 'lucide-react';

type Tab = 'anuales' | 'mensuales';

export default function MisSaldos() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>('anuales');
  const [vistaAnual, setVistaAnual] = React.useState<'tarjetas' | 'graficos'>('tarjetas');
  const [saldos, setSaldos] = React.useState<any[]>([]);
  const [mensuales, setMensuales] = React.useState<any[]>([]);
  const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
  const [mes, setMes] = React.useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [loading, setLoading] = React.useState(true);

  const cargar = React.useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'anuales') {
        const res = await apiClient<any>(`/saldos/mios?anio=${anio}`);
        setSaldos(res.data || []);
      } else {
        const [year, month] = mes.split('-');
        const res = await apiClient<any>(`/saldos/mensuales?anio=${year}&mes=${month}`);
        setMensuales(res.data || []);
      }
    } catch (e: any) {
      toast.error('Error al cargar saldos', e.mensaje);
    } finally {
      setLoading(false);
    }
  }, [tab, anio, mes, toast]);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const iconos: Record<string, any> = { LICENCIA: Wallet, PERMISO: Clock };

  const conTope = mensuales.filter((m) => m.max_solicitudes_mes !== null);
  const sinTope = mensuales.filter(
    (m) => m.max_solicitudes_mes === null && (m.usadas > 0 || m.asignado_anual !== null)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Mis saldos</h1>
        <p className="text-gray-600">Consulte sus saldos anuales y sus topes mensuales.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setTab('anuales')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'anuales' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            Saldos anuales
          </button>
          <button
            type="button"
            onClick={() => setTab('mensuales')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'mensuales' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            Topes mensuales
          </button>
        </div>

        {tab === 'anuales' ? (
          <div className="flex items-center gap-2">
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="input-field w-36"
            >
              {[2024, 2025, 2026, 2027].map((a) => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setVistaAnual((vista) => (vista === 'tarjetas' ? 'graficos' : 'tarjetas'))}
              aria-pressed={vistaAnual === 'graficos'}
            >
              {vistaAnual === 'tarjetas' ? (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Ver gráficas
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  Ver tarjetas
                </>
              )}
            </Button>
          </div>
        ) : (
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="input-field w-48"
          />
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : tab === 'anuales' ? (
        saldos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No hay saldos anuales registrados para este año.</p>
          </div>
        ) : vistaAnual === 'graficos' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saldos.map((s) => (
              <GraficoSemicirculo key={s.id_saldo} saldo={s} />
            ))}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {saldos.map((s) => {
                const disponible = s.asignado - s.usado;
                const porcentaje = s.asignado > 0 ? Math.min((s.usado / s.asignado) * 100, 100) : 0;
                const colorBarra =
                  porcentaje >= 100
                    ? 'bg-red-500'
                    : porcentaje >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                return (
                  <div key={s.id_saldo} className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_repeat(3,minmax(80px,0.55fr))_minmax(160px,1.1fr)] gap-4 lg:items-center">
                      <div>
                        <p className="font-semibold text-text">{s.tipo?.nombre}</p>
                        <p className="text-xs text-text-muted">
                          Período enero – diciembre {s.anio}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-text-muted">Asignado</p>
                        <p className="text-base font-bold text-text">
                          {formatearCantidad(s.asignado, s.tipo?.unidad_medida || 'DIAS')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-text-muted">Usado</p>
                        <p className="text-base font-bold text-text">
                          {formatearCantidad(s.usado, s.tipo?.unidad_medida || 'DIAS')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-text-muted">Disponible</p>
                        <p className="text-base font-bold text-emerald-700">
                          {formatearCantidad(disponible, s.tipo?.unidad_medida || 'DIAS')}
                        </p>
                      </div>

                      <div className="w-full">
                        <ProgressBar
                          valor={s.usado}
                          maximo={s.asignado}
                          className="h-2.5"
                          color={colorBarra}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            El conteo solo incluye solicitudes aprobadas: aprobadas por jefe, aprobadas por RRHH,
            en curso y ejecutadas. No incluye borradores, pendientes, observadas, rechazadas ni anuladas.
          </p>

          {conTope.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-gray-600">No hay tipos con tope mensual configurado.</p>
            </Card>
          ) : (
            conTope.map((m) => {
              const Icon = iconos[m.categoria] || CalendarDays;
              const usadas = Number(m.usadas || 0);
              const limite = Number(m.max_solicitudes_mes);
              const disponibles = m.disponibles === null ? null : Number(m.disponibles);
              const alcanzado = !!m.alcanzado;
              const detalle = Object.entries(m.por_estado || {})
                .filter(([, total]) => Number(total) > 0)
                .map(([estado, total]) => `${total} ${estadoLabel(estado).toLowerCase()}`)
                .join(' · ');

              return (
                <Card key={m.id_tipo} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">{m.nombre}</p>
                        <p className="text-xs text-gray-500">
                          Tope mensual de {limite} solicitud(es)
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${alcanzado ? 'text-red-600' : 'text-text'}`}>
                      {usadas}/{limite} usadas
                    </span>
                  </div>

                  <ProgressBar
                    valor={usadas}
                    maximo={limite}
                    className="h-3 mb-3"
                    color={
                      alcanzado
                        ? 'bg-red-500'
                        : limite > 0 && usadas / limite >= 0.75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }
                  />

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Usadas</p>
                      <p className="font-medium text-text">{usadas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Disponibles</p>
                      <p className="font-medium text-text">{disponibles ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Consumo aprobado</p>
                      <p className="font-medium text-text">
                        {m.cantidad_usada} {unidadLabel(m.unidad_medida)}
                      </p>
                    </div>
                  </div>

                  {detalle && (
                    <p className="text-xs text-text-muted">
                      Detalle: {detalle}.
                    </p>
                  )}

                  {alcanzado && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        Alcanzaste el tope mensual de este tipo. No podrás registrar otra solicitud
                        hasta el próximo mes o hasta que se anule una existente.
                      </p>
                    </div>
                  )}
                </Card>
              );
            })
          )}

          {sinTope.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-text mb-1">Sin tope mensual</h2>
              <p className="text-sm text-text-muted mb-4">
                Tipos sin límite de solicitudes por mes, con el consumo registrado en el período.
              </p>
              <div className="divide-y divide-border">
                {sinTope.map((m) => {
                  const topeAnual = m.asignado_anual !== null ? Number(m.asignado_anual) : null;
                  const usadoAnual = Number(m.usado_anual || 0);
                  const porcentajeAnual = topeAnual && topeAnual > 0
                    ? Math.min(100, (usadoAnual / topeAnual) * 100)
                    : 0;
                  const colorAnual = m.alcanzado_anual
                    ? 'bg-red-500'
                    : porcentajeAnual >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <div key={m.id_tipo} className="py-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-text">{m.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {topeAnual !== null
                              ? `Sin tope mensual · Tope anual: ${topeAnual} ${unidadLabel(m.unidad_medida)}`
                              : 'Sin tope mensual ni anual'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-text">{m.usadas} solicitud(es)</p>
                          <p className="text-xs text-gray-500">
                            {m.cantidad_usada} {unidadLabel(m.unidad_medida)} aprobados
                          </p>
                        </div>
                      </div>
                      {topeAnual !== null && (
                        <>
                          <ProgressBar
                            valor={usadoAnual}
                            maximo={topeAnual}
                            className="h-2"
                            color={colorAnual}
                          />
                          <p className="text-xs text-text-muted">
                            Usado: {usadoAnual} {unidadLabel(m.unidad_medida)} ·
                            {' '}Disponible: {m.disponible_anual ?? 0} {unidadLabel(m.unidad_medida)}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
