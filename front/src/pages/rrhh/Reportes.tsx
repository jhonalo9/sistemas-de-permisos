import React from 'react';
import { apiClient, descargarReporte } from '@/services/api';
import { Button, Card, useToast } from '@/components/common';
import { formatearFecha } from '@/utils/format';
import { BarChart3, Download, FileText, Wallet } from 'lucide-react';

type Tab = 'ausentismo' | 'licencias' | 'saldos' | 'descuentos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ausentismo', label: 'Ausentismo' },
  { id: 'licencias', label: 'Licencias por servidor' },
  { id: 'saldos', label: 'Saldos' },
  { id: 'descuentos', label: 'Descuentos' },
];

export default function Reportes() {
  const { toast } = useToast();
  const [mes, setMes] = React.useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
  const [tab, setTab] = React.useState<Tab>('ausentismo');
  const [ausentismo, setAusentismo] = React.useState<any[]>([]);
  const [licencias, setLicencias] = React.useState<any[]>([]);
  const [saldos, setSaldos] = React.useState<any[]>([]);
  const [descuentos, setDescuentos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [aRes, lRes, sRes, dRes] = await Promise.all([
          apiClient<any>(`/rrhh/reportes/ausentismo?mes=${mes}&anio=${anio}`),
          apiClient<any>(`/rrhh/reportes/licencias?mes=${mes}&anio=${anio}`),
          apiClient<any>(`/rrhh/reportes/saldos?anio=${anio}`),
          apiClient<any>(`/rrhh/reportes/descuentos?mes=${mes}&anio=${anio}`),
        ]);
        setAusentismo(aRes.data || []);
        setLicencias(lRes.data || []);
        setSaldos(sRes.data || []);
        setDescuentos(dRes.data || []);
      } catch (e: any) {
        toast.error('Error al cargar reportes', e.mensaje);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [mes, anio]);

  const exportar = async () => {
    try {
      await descargarReporte(tab, { mes, anio });
      toast.success('Reporte generado', 'El archivo Excel fue descargado.');
    } catch (e: any) {
      toast.error('Error al exportar', e?.mensaje || 'No se pudo generar el reporte');
    }
  };

  const filtrosPeriodo = (
    <div className="flex gap-4 items-end">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Mes</label>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="input-field w-32">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Año</label>
        <select value={anio} onChange={(e) => setAnio(e.target.value)} className="input-field w-40">
          {[2024, 2025, 2026, 2027].map((a) => (
            <option key={a} value={String(a)}>{a}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const contenido = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (tab === 'ausentismo') {
      return ausentismo.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No hay datos de ausentismo para este mes.</p>
      ) : (
        <div className="space-y-4">
          {ausentismo.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 text-right text-xs text-gray-500">{r.unidad}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full"
                  style={{ width: `${Math.min(Number(r.total_cantidad || 0) * 10, 100)}%` }}
                />
              </div>
              <div className="w-24 text-right text-sm font-medium text-text">
                {r.total_cantidad} {r.unidad_medida === 'DIAS' ? 'días' : 'horas'}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tab === 'licencias') {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['N.º', 'DNI', 'Servidor', 'Cargo', 'Unidad', 'Tipo', 'Desde', 'Hasta', 'Cantidad', 'Estado'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {licencias.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm">{r.nro_solicitud}</td>
                  <td className="px-3 py-3 text-sm">{r.dni}</td>
                  <td className="px-3 py-3 text-sm">{r.servidor}</td>
                  <td className="px-3 py-3 text-sm">{r.cargo || '—'}</td>
                  <td className="px-3 py-3 text-sm">{r.unidad || '—'}</td>
                  <td className="px-3 py-3 text-sm">{r.tipo}</td>
                  <td className="px-3 py-3 text-sm">{formatearFecha(r.fecha_inicio)}</td>
                  <td className="px-3 py-3 text-sm">{formatearFecha(r.fecha_fin)}</td>
                  <td className="px-3 py-3 text-sm">{r.cantidad}</td>
                  <td className="px-3 py-3 text-sm">{r.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {licencias.length === 0 && <p className="text-center text-gray-500 py-10">Sin licencias en el período.</p>}
        </div>
      );
    }

    if (tab === 'saldos') {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['DNI', 'Servidor', 'Cargo', 'Unidad', 'Tipo', 'Año', 'Asignado', 'Usado', 'Disponible'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {saldos.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm">{r.dni}</td>
                  <td className="px-3 py-3 text-sm">{r.servidor}</td>
                  <td className="px-3 py-3 text-sm">{r.cargo || '—'}</td>
                  <td className="px-3 py-3 text-sm">{r.unidad || '—'}</td>
                  <td className="px-3 py-3 text-sm">{r.tipo}</td>
                  <td className="px-3 py-3 text-sm">{r.anio}</td>
                  <td className="px-3 py-3 text-sm">{r.asignado}</td>
                  <td className="px-3 py-3 text-sm">{r.usado}</td>
                  <td className="px-3 py-3 text-sm">{r.disponible}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {saldos.length === 0 && <p className="text-center text-gray-500 py-10">Sin saldos para el año.</p>}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['DNI', 'Servidor', 'Tipo', 'Días sin goce'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {descuentos.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{r.dni}</td>
                <td className="px-4 py-3 text-sm">{r.servidor}</td>
                <td className="px-4 py-3 text-sm">{r.tipo}</td>
                <td className="px-4 py-3 text-sm text-right">{r.dias_sin_goce}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {descuentos.length === 0 && <p className="text-center text-gray-500 py-10">Sin descuentos en el período.</p>}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Reportes</h1>
        <p className="text-gray-600">Ausentismo, licencias, saldos y descuentos para planilla.</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        {filtrosPeriodo}
        <Button variant="primary" onClick={exportar}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text border-border hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          {tab === 'ausentismo' && <BarChart3 className="w-4 h-4 text-primary" />}
          {tab === 'licencias' && <FileText className="w-4 h-4 text-primary" />}
          {tab === 'saldos' && <Wallet className="w-4 h-4 text-primary" />}
          {tab === 'descuentos' && <FileText className="w-4 h-4 text-primary" />}
          <h2 className="text-lg font-semibold text-text">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>
        </div>
        {contenido()}
      </Card>
    </div>
  );
}
