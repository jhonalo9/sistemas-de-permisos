import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, Select, TextArea, useToast } from '@/components/common';
import { useAuthStore } from '@/store/auth';
import { formatearFecha } from '@/utils/format';
import { AlertTriangle, Edit2, Plus, Search, X } from 'lucide-react';

const TIPOS = [
  { value: 'ENFERMEDAD', label: 'Enfermedad' },
  { value: 'JUSTIFICADA', label: 'Falta justificada' },
  { value: 'INJUSTIFICADA', label: 'Falta injustificada' },
  { value: 'ABANDONO', label: 'Abandono de centro de labores' },
];

const ESTADOS = [
  { value: 'REGISTRADA', label: 'Registrada' },
  { value: 'JUSTIFICADA', label: 'Justificada' },
  { value: 'INJUSTIFICADA', label: 'Injustificada' },
  { value: 'CON_DESCUENTO', label: 'Con descuento' },
  { value: 'ANULADA', label: 'Anulada' },
];

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function estadoInasistencia(estado: string): string {
  const clases: Record<string, string> = {
    REGISTRADA: 'bg-slate-100 text-slate-700 border-slate-200',
    JUSTIFICADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INJUSTIFICADA: 'bg-red-50 text-red-700 border-red-200',
    CON_DESCUENTO: 'bg-amber-50 text-amber-800 border-amber-200',
    ANULADA: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return clases[estado] || clases.REGISTRADA;
}

export default function Inasistencias() {
  const { toast } = useToast();
  const { usuario } = useAuthStore();
  const puedeEditar = !!usuario?.roles.some((r) => r === 'RRHH' || r === 'ADMIN');

  const [registros, setRegistros] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mes, setMes] = React.useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editando, setEditando] = React.useState<any | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [busquedaServidor, setBusquedaServidor] = React.useState('');
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [servidorSeleccionado, setServidorSeleccionado] = React.useState<any | null>(null);
  const [buscando, setBuscando] = React.useState(false);
  const [form, setForm] = React.useState<any>({});

  const cargar = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>(`/inasistencias?mes=${mes}&anio=${anio}`);
      setRegistros(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar inasistencias', e?.mensaje);
    } finally {
      setLoading(false);
    }
  }, [mes, anio, toast]);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const buscarServidor = async (q: string) => {
    if (q.trim().length < 2) {
      setServidores([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await apiClient<any>(`/marcaciones/buscar-servidor?q=${encodeURIComponent(q.trim())}`);
      setServidores(res.data || []);
    } catch {
      setServidores([]);
    } finally {
      setBuscando(false);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setServidorSeleccionado(null);
    setBusquedaServidor('');
    setServidores([]);
    setForm({
      id_servidor: '',
      fecha: hoy(),
      tipo: 'INJUSTIFICADA',
      motivo: '',
      fecha_comunicacion: '',
      fecha_sustento: '',
      estado: 'REGISTRADA',
      dias_descuento: '1',
      observacion: '',
    });
    setModalOpen(true);
  };

  const abrirEditar = (r: any) => {
    setEditando(r);
    setServidorSeleccionado({
      id_servidor: r.id_servidor,
      dni: r.dni,
      apellidos: r.servidor?.split(', ')[0] || '',
      nombres: r.servidor?.split(', ').slice(1).join(', ') || '',
      unidad: r.unidad,
    });
    setBusquedaServidor(r.servidor || '');
    setServidores([]);
    setForm({
      id_servidor: r.id_servidor,
      fecha: r.fecha || '',
      tipo: r.tipo || 'INJUSTIFICADA',
      motivo: r.motivo || '',
      fecha_comunicacion: r.fecha_comunicacion || '',
      fecha_sustento: r.fecha_sustento || '',
      estado: r.estado || 'REGISTRADA',
      dias_descuento: String(r.dias_descuento ?? 0),
      observacion: r.observacion || '',
    });
    setModalOpen(true);
  };

  const cambiarTipo = (tipo: string) => {
    setForm((prev: any) => ({
      ...prev,
      tipo,
      dias_descuento:
        tipo === 'INJUSTIFICADA' || tipo === 'ABANDONO' ? '1' : '0',
    }));
  };

  const guardar = async () => {
    if (!editando) {
      if (!servidorSeleccionado) {
        toast.error('Servidor requerido', 'Seleccione al servidor.');
        return;
      }
      if (!form.fecha || !form.tipo) {
        toast.error('Datos incompletos', 'Indique la fecha y el tipo.');
        return;
      }
    }

    setGuardando(true);
    try {
      const body = {
        ...form,
        id_servidor: servidorSeleccionado?.id_servidor || form.id_servidor,
      };
      if (editando) {
        await apiClient<any>(`/inasistencias/${editando.id_inasistencia}`, {
          method: 'PUT',
          body,
        });
        toast.success('Inasistencia actualizada', 'Los cambios fueron guardados.');
      } else {
        await apiClient<any>('/inasistencias', { method: 'POST', body });
        toast.success('Inasistencia registrada', 'El registro fue guardado.');
      }
      setModalOpen(false);
      await cargar();
    } catch (e: any) {
      toast.error('Error al guardar', e?.mensaje || 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Inasistencias y abandonos</h1>
          <p className="text-gray-600">Registre faltas, enfermedades, justificaciones y abandonos.</p>
        </div>
        <Button variant="primary" onClick={abrirNuevo}>
          <Plus className="w-4 h-4 mr-1" />
          Registrar inasistencia
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="label">Mes</label>
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="input-field w-32">
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Año</label>
          <select value={anio} onChange={(e) => setAnio(e.target.value)} className="input-field w-40">
            {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : registros.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No hay inasistencias registradas en el período.</p>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {registros.map((r) => (
              <Card key={r.id_inasistencia} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">{formatearFecha(r.fecha)}</p>
                    <p className="font-semibold text-text">{r.servidor}</p>
                    <p className="text-xs text-gray-500">{r.unidad || '—'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded border ${estadoInasistencia(r.estado)}`}>
                    {ESTADOS.find((e) => e.value === r.estado)?.label || r.estado}
                  </span>
                </div>
                <p className="text-sm text-text mt-2">{TIPOS.find((t) => t.value === r.tipo)?.label || r.tipo}</p>
                <p className="text-sm text-gray-600 mt-1">Días de descuento: {r.dias_descuento}</p>
                {puedeEditar && (
                  <Button variant="outline" className="w-full mt-3" onClick={() => abrirEditar(r)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Editar
                  </Button>
                )}
              </Card>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Servidor', 'Unidad', 'Tipo', 'Estado', 'Días descuento', 'Comunicación', 'Sustento', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registros.map((r) => (
                  <tr key={r.id_inasistencia} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{formatearFecha(r.fecha)}</td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-text">{r.servidor}</p>
                      <p className="text-xs text-gray-500">{r.dni}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.unidad || '—'}</td>
                    <td className="px-4 py-3 text-sm">{TIPOS.find((t) => t.value === r.tipo)?.label || r.tipo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${estadoInasistencia(r.estado)}`}>
                        {ESTADOS.find((e) => e.value === r.estado)?.label || r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.dias_descuento}</td>
                    <td className="px-4 py-3 text-sm">{r.fecha_comunicacion ? formatearFecha(r.fecha_comunicacion) : '—'}</td>
                    <td className="px-4 py-3 text-sm">{r.fecha_sustento ? formatearFecha(r.fecha_sustento) : '—'}</td>
                    <td className="px-4 py-3">
                      {puedeEditar && (
                        <Button variant="outline" onClick={() => abrirEditar(r)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card w-full max-w-2xl max-h-[94vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-text">{editando ? 'Editar inasistencia' : 'Registrar inasistencia'}</h2>
                <p className="text-sm text-gray-600">Registre la falta o abandono y su estado de justificación.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!editando && (
                <div>
                  <label className="label">Servidor</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={busquedaServidor}
                      onChange={(e) => {
                        setBusquedaServidor(e.target.value);
                        setServidorSeleccionado(null);
                        buscarServidor(e.target.value);
                      }}
                      placeholder="Busque por DNI o apellidos"
                      className="input-field pl-10"
                    />
                  </div>
                  {servidores.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mt-1">
                      {buscando ? <p className="p-2 text-sm text-gray-500">Buscando...</p> : servidores.map((s) => (
                        <button
                          key={s.id_servidor}
                          type="button"
                          onClick={() => {
                            setServidorSeleccionado(s);
                            setBusquedaServidor(`${s.apellidos}, ${s.nombres}`);
                            setServidores([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          <span className="font-medium">{s.apellidos}, {s.nombres}</span>
                          <span className="text-gray-500"> · {s.dni}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {servidorSeleccionado && (
                    <p className="helper-text">Seleccionado: {servidorSeleccionado.apellidos}, {servidorSeleccionado.nombres} ({servidorSeleccionado.dni})</p>
                  )}
                </div>
              )}

              {editando && (
                <div className="rounded-lg bg-slate-50 border border-border p-3 text-sm">
                  <p className="font-medium text-text">{editando.servidor}</p>
                  <p className="text-gray-500">{editando.dni} · {editando.unidad || '—'}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  disabled={!!editando}
                />
                <Select
                  label="Tipo"
                  options={TIPOS}
                  value={form.tipo}
                  onChange={(e) => cambiarTipo(e.target.value)}
                  disabled={!!editando}
                />
                <Input
                  label="Fecha de comunicación"
                  type="date"
                  value={form.fecha_comunicacion}
                  onChange={(e) => setForm({ ...form, fecha_comunicacion: e.target.value })}
                />
                <Input
                  label="Fecha de sustento"
                  type="date"
                  value={form.fecha_sustento}
                  onChange={(e) => setForm({ ...form, fecha_sustento: e.target.value })}
                />
                <Select
                  label="Estado"
                  options={ESTADOS}
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                />
                <Input
                  label="Días de descuento"
                  type="number"
                  step="0.01"
                  value={form.dias_descuento}
                  onChange={(e) => setForm({ ...form, dias_descuento: e.target.value })}
                />
              </div>

              <Input label="Motivo" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
              <TextArea
                label="Observación"
                rows={3}
                value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              />
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={guardando}>Cancelar</Button>
              <Button variant="primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
