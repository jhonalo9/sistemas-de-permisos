import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, ProgressBar, useToast } from '@/components/common';
import GraficoSemicirculo from '@/components/saldos/GraficoSemicirculo';
import { estadoLabel, formatearCantidad } from '@/utils/format';
import { BarChart3, LayoutGrid } from 'lucide-react';

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

  const conTope = mensuales.filter((m) => m.max_solicitudes_mes !== null);
  const sinTope = mensuales.filter(
    (m) => m.max_solicitudes_mes === null && (m.usadas > 0 || m.asignado_anual !== null)
  );

  const [anioPeriodo, mesPeriodo] = mes.split('-');
  const nombreMes = new Date(Number(anioPeriodo), Number(mesPeriodo) - 1, 1)
    .toLocaleDateString('es-PE', { month: 'long' })
    .replace(/^\w/, (c) => c.toUpperCase());
  const periodoMes = `${nombreMes} ${anioPeriodo}`;

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
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-border">
                {conTope.map((m) => {
                  const usadas = Number(m.usadas || 0);
                  const limite = Number(m.max_solicitudes_mes);
                  const disponibles = m.disponibles === null ? null : Number(m.disponibles);
                  const alcanzado = !!m.alcanzado;
                  const porcentaje = limite > 0 ? Math.min(100, (usadas / limite) * 100) : 0;
                  const colorBarra = alcanzado
                    ? 'bg-red-500'
                    : porcentaje >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';
                  const detalle = Object.entries(m.por_estado || {})
                    .filter(([, total]) => Number(total) > 0)
                    .map(([estado, total]) => `${total} ${estadoLabel(estado).toLowerCase()}`)
                    .join(' · ');

                  return (
                    <div key={m.id_tipo} className="p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_repeat(3,minmax(80px,0.55fr))_minmax(160px,1.1fr)] gap-4 lg:items-center">
                        <div>
                          <p className="font-semibold text-text">{m.nombre}</p>
                          <p className="text-xs text-text-muted">
                            Período {periodoMes} · Tope mensual: {limite} solicitud(es)
                          </p>
                          {detalle && (
                            <p className="text-xs text-text-muted mt-1">Detalle: {detalle}.</p>
                          )}
                          {Number(m.cantidad_usada) > 0 && (
                            <p className="text-xs text-text-muted mt-1">
                              Consumo aprobado: {formatearCantidad(m.cantidad_usada, m.unidad_medida)}
                            </p>
                          )}
                          {alcanzado && (
                            <p className="text-xs font-semibold text-red-600 mt-1">
                              Alcanzaste el tope mensual de este tipo.
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-text-muted">Tope</p>
                          <p className="text-base font-bold text-text">{limite}</p>
                        </div>

                        <div>
                          <p className="text-xs text-text-muted">Usadas</p>
                          <p className="text-base font-bold text-text">{usadas}</p>
                        </div>

                        <div>
                          <p className="text-xs text-text-muted">Disponibles</p>
                          <p className={`text-base font-bold ${alcanzado ? 'text-red-600' : 'text-emerald-700'}`}>
                            {disponibles ?? '—'}
                          </p>
                        </div>

                        <div className="w-full">
                          <ProgressBar
                            valor={usadas}
                            maximo={limite}
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
          )}

          {sinTope.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-text">Sin tope mensual</h2>
                <p className="text-sm text-text-muted">
                  Tipos sin límite de solicitudes por mes, con el consumo registrado en el período.
                </p>
              </div>
              <div className="divide-y divide-border">
                {sinTope.map((m) => {
                  const topeAnual = m.asignado_anual !== null ? Number(m.asignado_anual) : null;
                  const usadoAnual = Number(m.usado_anual || 0);
                  const disponibleAnual = m.disponible_anual !== null
                    ? Number(m.disponible_anual)
                    : null;
                  const porcentajeAnual = topeAnual && topeAnual > 0
                    ? Math.min(100, (usadoAnual / topeAnual) * 100)
                    : 0;
                  const colorAnual = m.alcanzado_anual
                    ? 'bg-red-500'
                    : porcentajeAnual >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                  return (
                    <div key={m.id_tipo} className="p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_repeat(3,minmax(80px,0.55fr))_minmax(160px,1.1fr)] gap-4 lg:items-center">
                        <div>
                          <p className="font-semibold text-text">{m.nombre}</p>
                          <p className="text-xs text-text-muted">
                            Período {periodoMes} · Sin tope mensual
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {topeAnual !== null
                              ? `Tope anual: ${formatearCantidad(topeAnual, m.unidad_medida)}`
                              : 'Sin tope mensual ni anual'}
                          </p>
                        </div>

                        {topeAnual !== null ? (
                          <>
                            <div>
                              <p className="text-xs text-text-muted">Tope anual</p>
                              <p className="text-base font-bold text-text">
                                {formatearCantidad(topeAnual, m.unidad_medida)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted">Usado</p>
                              <p className="text-base font-bold text-text">
                                {formatearCantidad(usadoAnual, m.unidad_medida)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted">Disponible</p>
                              <p className="text-base font-bold text-emerald-700">
                                {formatearCantidad(disponibleAnual ?? 0, m.unidad_medida)}
                              </p>
                            </div>
                            <div className="w-full">
                              <ProgressBar
                                valor={usadoAnual}
                                maximo={topeAnual}
                                className="h-2.5"
                                color={colorAnual}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs text-text-muted">Usadas este mes</p>
                              <p className="text-base font-bold text-text">{m.usadas}</p>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted">Consumo aprobado</p>
                              <p className="text-base font-bold text-text">
                                {formatearCantidad(m.cantidad_usada, m.unidad_medida)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
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
