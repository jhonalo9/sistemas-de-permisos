import React from 'react';
import { apiClient } from '@/services/api';
import { Badge, Button, Card, Input, Select, TextArea, useToast } from '@/components/common';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emergenciaSchema } from '@/utils/validations';
import { diasRestantes, esVencida, formatearFecha } from '@/utils/format';
import { AlertTriangle, Clock, Plus, Search, X } from 'lucide-react';

function valoresIniciales() {
  const ahora = new Date();
  return {
    id_servidor: '',
    fecha_salida: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`,
    hora_salida: `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
    motivo: '',
    autorizado_por: '',
    observacion: '',
  };
}

export default function SalidaEmergencia() {
  const { toast } = useToast();
  const [emergencias, setEmergencias] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState('');
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [servidorSeleccionado, setServidorSeleccionado] = React.useState<any | null>(null);
  const [mostrarResultados, setMostrarResultados] = React.useState(false);
  const [buscando, setBuscando] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(emergenciaSchema),
    defaultValues: valoresIniciales(),
  });

  const cargar = React.useCallback(async () => {
    try {
      const res = await apiClient<any>('/marcaciones/emergencias');
      setEmergencias(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar emergencias', e.mensaje);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (q: string) => {
    if (q.trim().length < 2) {
      setServidores([]);
      setMostrarResultados(false);
      return;
    }

    setBuscando(true);
    try {
      const res = await apiClient<any>('/marcaciones/buscar-servidor?q=' + encodeURIComponent(q.trim()));
      setServidores(res.data || []);
      setMostrarResultados(true);
    } catch {
      setServidores([]);
      setMostrarResultados(true);
    } finally {
      setBuscando(false);
    }
  };

  const opcionesServidor = React.useMemo(() => {
    const lista = servidorSeleccionado ? [servidorSeleccionado, ...servidores] : servidores;
    const vistos = new Set<number>();
    return lista
      .filter((s) => {
        const id = Number(s.id_servidor);
        if (vistos.has(id)) return false;
        vistos.add(id);
        return true;
      })
      .map((s) => ({
        value: s.id_servidor,
        label: `${s.apellidos}, ${s.nombres} (${s.dni})`,
      }));
  }, [servidores, servidorSeleccionado]);

  const filtradas = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return emergencias;
    return emergencias.filter((e) =>
      [e.nro_solicitud, e.servidor, e.dni, e.unidad, e.motivo, e.autorizado_por]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [emergencias, busqueda]);

  const abrirModal = () => {
    reset(valoresIniciales());
    setSearchQuery('');
    setServidorSeleccionado(null);
    setServidores([]);
    setMostrarResultados(false);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setMostrarResultados(false);
  };

  const onSubmit = async (datos: any) => {
    setSubmitting(true);
    try {
      const res = await apiClient<any>('/marcaciones/emergencia', {
        method: 'POST',
        body: datos,
      });
      const limite = res.data?.fecha_limite_regularizacion;
      toast.success(
        'Salida de emergencia registrada',
        limite
          ? `Fecha límite de regularización: ${formatearFecha(limite)}.`
          : 'Se ha generado la salida de emergencia.'
      );

      setModalOpen(false);
      reset(valoresIniciales());
      setSearchQuery('');
      setServidorSeleccionado(null);
      setServidores([]);
      setMostrarResultados(false);
      await cargar();
    } catch (e: any) {
      toast.error('Error al registrar', e.mensaje);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Salidas de emergencia</h1>
          <p className="text-gray-600">
            Registre y consulte todas las salidas de emergencia del personal.
          </p>
        </div>
        <Button variant="primary" className="sm:min-w-[190px]" onClick={abrirModal}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva emergencia
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por servidor, DNI o N.º de solicitud"
            className="input-field pl-10"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filtradas.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">
            {emergencias.length === 0
              ? 'No hay salidas de emergencia registradas.'
              : 'No se encontraron emergencias con ese criterio.'}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N.º solicitud</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Salida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Autorizado por</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Límite regularización</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtradas.map((e) => {
                const vencida = esVencida(e.fecha_limite_regularizacion);
                const dias = diasRestantes(e.fecha_limite_regularizacion);
                const enRegularizacion = e.estado === 'REGULARIZAR';

                return (
                  <tr key={e.id_solicitud} className={`hover:bg-gray-50 ${enRegularizacion && vencida ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-text">{e.nro_solicitud}</td>
                    <td className="px-4 py-3 text-sm text-text">
                      <p className="font-medium">{e.servidor || '—'}</p>
                      <p className="text-xs text-gray-500">{e.dni || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{e.unidad || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      <p>{formatearFecha(e.fecha_inicio)}</p>
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(e.hora_inicio || '').slice(0, 5)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text" title={e.observacion || ''}>
                      <p className="max-w-xs">{e.motivo || '—'}</p>
                      {e.tipo_codigo && e.tipo_codigo !== 'PER_EMERGENCIA' && (
                        <p className="text-xs text-gray-500">Regularizado como: {e.tipo_actual}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{e.autorizado_por || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge estado={e.estado} />
                      {enRegularizacion && (
                        <p
                          className={`text-xs font-semibold mt-1 ${
                            vencida ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          {vencida ? 'VENCIDA' : `${dias} día(s)`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      {e.fecha_limite_regularizacion
                        ? formatearFecha(e.fecha_limite_regularizacion)
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Registrar salida de emergencia"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={cerrarModal} />

          <div className="relative bg-card w-full max-w-2xl max-h-[94vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-text">Registrar salida de emergencia</h2>
                <p className="text-sm text-gray-600">
                  Complete los datos reales de la salida del servidor.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-text"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="label">Buscar servidor</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(ev) => {
                      const valor = ev.target.value;
                      setSearchQuery(valor);
                      setServidorSeleccionado(null);
                      setValue('id_servidor', '');
                      setValue('autorizado_por', '');
                      handleSearch(valor);
                    }}
                    onBlur={() => setTimeout(() => setMostrarResultados(false), 200)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) handleSearch(searchQuery);
                    }}
                    placeholder="Busque por DNI o nombre y apellidos"
                    className="input-field pl-10"
                  />

                  {mostrarResultados && searchQuery.trim().length >= 2 && (
                    <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {buscando ? (
                        <div className="p-3 text-sm text-gray-500">Buscando...</div>
                      ) : servidores.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No se encontraron servidores.</div>
                      ) : (
                        servidores.map((s) => (
                          <button
                            key={s.id_servidor}
                            type="button"
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => {
                              setValue('id_servidor', s.id_servidor, { shouldValidate: true });
                              setValue('autorizado_por', s.jefe_nombre || '', {
                                shouldValidate: true,
                              });
                              setServidorSeleccionado(s);
                              setSearchQuery(`${s.apellidos}, ${s.nombres}`);
                              setServidores([]);
                              setMostrarResultados(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                          >
                            <div className="font-medium text-text">
                              {s.apellidos}, {s.nombres}
                            </div>
                            <div className="text-xs text-gray-500">
                              {s.dni} • {s.unidad}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Select
                  label="Servidor"
                  options={opcionesServidor}
                  value={watch('id_servidor') ? String(watch('id_servidor')) : ''}
                  onChange={(ev) => {
                    const id = Number(ev.target.value);
                    setValue('id_servidor', id, { shouldValidate: true });
                    const lista = servidorSeleccionado
                      ? [servidorSeleccionado, ...servidores]
                      : servidores;
                    const s = lista.find((x) => Number(x.id_servidor) === id);
                    if (s) {
                      setValue('autorizado_por', s.jefe_nombre || '', {
                        shouldValidate: true,
                      });
                      setServidorSeleccionado(s);
                      setSearchQuery(`${s.apellidos}, ${s.nombres}`);
                      setMostrarResultados(false);
                    }
                  }}
                  error={errors.id_servidor}
                  helper={
                    opcionesServidor.length === 0
                      ? 'Primero busque al servidor arriba.'
                      : undefined
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Fecha real de salida"
                    type="date"
                    {...register('fecha_salida')}
                    error={errors.fecha_salida}
                  />
                  <Input
                    label="Hora real de salida"
                    type="time"
                    {...register('hora_salida')}
                    error={errors.hora_salida}
                  />
                </div>
                <p className="helper-text -mt-2">
                  Registre la fecha y hora reales, aunque la salida haya ocurrido antes.
                </p>

                <Input
                  label="Jefe que autoriza"
                  {...register('autorizado_por')}
                  error={errors.autorizado_por}
                  helper={
                    servidorSeleccionado
                      ? servidorSeleccionado.jefe_nombre
                        ? 'Se completa automáticamente con el jefe inmediato del servidor.'
                        : 'El servidor no tiene jefe registrado. Ingrese quién autoriza.'
                      : 'Seleccione un servidor para autocompletar este campo.'
                  }
                />
                <Input label="Motivo" {...register('motivo')} error={errors.motivo} />
                <TextArea
                  label="Observación"
                  {...register('observacion')}
                  rows={3}
                  error={errors.observacion}
                />

                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                  <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                    {submitting ? 'Registrando...' : 'Registrar salida de emergencia'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={cerrarModal}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
