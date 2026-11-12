import React, { useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, Select, useToast, Badge } from '@/components/common';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tipoSolicitudSchema } from '@/utils/validations';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { asBool } from '@/utils/format';

const defaultValues = {
  codigo: '',
  nombre: '',
  categoria: 'PERMISO',
  con_goce: true,
  unidad_medida: 'DIAS',
  max_por_solicitud: '',
  max_por_anio: '',
  max_solicitudes_mes: '',
  dias_anticipacion: 0,
  anticipacion_dias_habiles: true,
  permite_mismo_dia: true,
  max_horas_semana: '',
  max_horas_dia: '',
  requiere_entrega_cargo: false,
  autoridad_aprobacion: 'RRHH',
  tipo_sustento: '',
  requiere_sustento: true,
  permite_regularizar: false,
  dias_calendario: true,
  ajustar_siguiente_habil: false,
  base_legal: '',
  plazo_regularizacion_dias: '',
  activo: true,
};

export default function TiposSolicitud() {
  const { toast } = useToast();
  const [tipos, setTipos] = React.useState<any[]>([]);
  const [editing, setEditing] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [condiciones, setCondiciones] = React.useState<any[]>([]);
  const [nuevaCond, setNuevaCond] = React.useState<any>({
    codigo: '',
    nombre: '',
    dias_extra: '0',
    dias_calendario: true,
    grupo: '',
    descripcion: '',
  });
  const [savingCond, setSavingCond] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(tipoSolicitudSchema),
    defaultValues,
  });

  const cargar = useCallback(async () => {
    try {
      const res = await apiClient<any>('/admin/tipos');
      setTipos(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar tipos', e?.mensaje);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    cargar();
    // Solo al montar; toast es estable gracias al context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNuevo = () => {
    setEditing(null);
    setCondiciones([]);
    reset(defaultValues);
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditing(null);
    setCondiciones([]);
    reset(defaultValues);
  };

  const onSubmit = async (datos: any) => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient<any>(`/admin/tipos/${editing.id_tipo}`, {
          method: 'PUT',
          body: datos,
        });
        toast.success('Tipo actualizado', 'El tipo de solicitud se ha actualizado.');
      } else {
        await apiClient<any>('/admin/tipos', {
          method: 'POST',
          body: datos,
        });
        toast.success('Tipo creado', 'El tipo de solicitud se ha creado.');
      }
      cerrarForm();
      await cargar();
    } catch (e: any) {
      toast.error('Error al guardar', e?.mensaje);
    } finally {
      setSaving(false);
    }
  };

  const editar = (tipo: any) => {
    setEditing(tipo);
    reset({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      categoria: tipo.categoria,
      con_goce: asBool(tipo.con_goce),
      unidad_medida: tipo.unidad_medida,
      max_por_solicitud: tipo.max_por_solicitud ?? '',
      max_por_anio: tipo.max_por_anio ?? '',
      max_solicitudes_mes: tipo.max_solicitudes_mes ?? '',
      dias_anticipacion: tipo.dias_anticipacion ?? 0,
      anticipacion_dias_habiles: asBool(tipo.anticipacion_dias_habiles),
      permite_mismo_dia: asBool(tipo.permite_mismo_dia),
      max_horas_semana: tipo.max_horas_semana ?? '',
      max_horas_dia: tipo.max_horas_dia ?? '',
      requiere_entrega_cargo: asBool(tipo.requiere_entrega_cargo),
      autoridad_aprobacion: tipo.autoridad_aprobacion || 'RRHH',
      tipo_sustento: tipo.tipo_sustento ?? '',
      requiere_sustento: asBool(tipo.requiere_sustento),
      permite_regularizar: asBool(tipo.permite_regularizar),
      dias_calendario: asBool(tipo.dias_calendario),
      ajustar_siguiente_habil: asBool(tipo.ajustar_siguiente_habil),
      base_legal: tipo.base_legal ?? '',
      plazo_regularizacion_dias: tipo.plazo_regularizacion_dias ?? '',
      activo: asBool(tipo.activo),
    });
    setCondiciones(tipo.condiciones || []);
    setNuevaCond({
      codigo: '',
      nombre: '',
      dias_extra: '0',
      dias_calendario: true,
      grupo: '',
      descripcion: '',
    });
    setShowForm(true);
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro de desactivar este tipo?')) return;
    try {
      await apiClient<any>(`/admin/tipos/${id}`, {
        method: 'PUT',
        body: { activo: 0 },
      });
      toast.success('Tipo desactivado', 'El tipo se ha marcado como inactivo.');
      await cargar();
    } catch (e: any) {
      toast.error('Error al desactivar', e?.mensaje);
    }
  };

  const agregarCondicion = async () => {
    if (!editing) return;
    if (!nuevaCond.codigo.trim() || !nuevaCond.nombre.trim()) {
      toast.error('Datos incompletos', 'Indique el código y el nombre de la condición.');
      return;
    }
    setSavingCond(true);
    try {
      const res = await apiClient<any>(`/admin/tipos/${editing.id_tipo}/condiciones`, {
        method: 'POST',
        body: {
          codigo: nuevaCond.codigo,
          nombre: nuevaCond.nombre,
          dias_extra: Number(nuevaCond.dias_extra || 0),
          dias_calendario: nuevaCond.dias_calendario ? 1 : 0,
          grupo: nuevaCond.grupo,
          descripcion: nuevaCond.descripcion,
        },
      });
      setCondiciones((prev) => [
        ...prev,
        {
          id_condicion: res.data?.id_condicion ?? Date.now(),
          codigo: nuevaCond.codigo.toUpperCase(),
          nombre: nuevaCond.nombre,
          dias_extra: Number(nuevaCond.dias_extra || 0),
          dias_calendario: nuevaCond.dias_calendario ? 1 : 0,
          grupo: nuevaCond.grupo ? nuevaCond.grupo.toUpperCase() : null,
          descripcion: nuevaCond.descripcion,
          activo: 1,
        },
      ]);
      setNuevaCond({ codigo: '', nombre: '', dias_extra: '0', dias_calendario: true, grupo: '', descripcion: '' });
      toast.success('Condición agregada', 'La regla condicional fue creada.');
    } catch (e: any) {
      toast.error('Error al crear condición', e?.mensaje);
    } finally {
      setSavingCond(false);
    }
  };

  const eliminarCondicion = async (id: number) => {
    if (!window.confirm('¿Eliminar esta condición?')) return;
    try {
      await apiClient(`/admin/condiciones/${id}`, { method: 'DELETE' });
      setCondiciones((prev) => prev.filter((c) => c.id_condicion !== id));
      toast.success('Condición eliminada', 'La regla ya no se aplicará.');
    } catch (e: any) {
      toast.error('Error al eliminar', e?.mensaje);
    }
  };

  const alternarCondicion = async (c: any) => {
    try {
      await apiClient(`/admin/condiciones/${c.id_condicion}`, {
        method: 'PUT',
        body: { activo: asBool(c.activo) ? 0 : 1 },
      });
      setCondiciones((prev) =>
        prev.map((x) =>
          x.id_condicion === c.id_condicion ? { ...x, activo: asBool(c.activo) ? 0 : 1 } : x
        )
      );
    } catch (e: any) {
      toast.error('Error al actualizar', e?.mensaje);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="mt-4 text-sm text-text-muted">Cargando tipos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Catálogo de tipos de solicitud</h1>
          <p className="text-text-muted mt-1">Administre los tipos de permisos y licencias disponibles.</p>
        </div>
        <Button variant="primary" onClick={abrirNuevo}>
          <Plus className="w-4 h-4" />
          Nuevo tipo
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">
              {editing ? 'Editar tipo' : 'Nuevo tipo'}
            </h2>
            <button
              type="button"
              onClick={cerrarForm}
              className="p-2 rounded-xl text-text-muted hover:bg-slate-100 hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Código" {...register('codigo')} error={errors.codigo} />
            <Input label="Nombre" {...register('nombre')} error={errors.nombre} />
            <Select
              label="Categoría"
              options={[
                { value: 'LICENCIA', label: 'Licencia' },
                { value: 'PERMISO', label: 'Permiso' },
              ]}
              value={watch('categoria') || ''}
              onChange={(e) => setValue('categoria', e.target.value)}
              error={errors.categoria}
            />
            <Select
              label="Unidad de medida"
              options={[
                { value: 'DIAS', label: 'Días' },
                { value: 'HORAS', label: 'Horas' },
              ]}
              value={watch('unidad_medida') || ''}
              onChange={(e) => setValue('unidad_medida', e.target.value)}
              error={errors.unidad_medida}
            />
            <Input type="number" label="Tope por solicitud" {...register('max_por_solicitud')} error={errors.max_por_solicitud} />
            <Input type="number" label="Tope anual" {...register('max_por_anio')} error={errors.max_por_anio} />
            <Input type="number" label="Máx. solicitudes por mes" {...register('max_solicitudes_mes')} error={errors.max_solicitudes_mes} />
            <Input type="number" label="Días de anticipación" {...register('dias_anticipacion')} error={errors.dias_anticipacion} />
            <Input type="number" label="Máx. horas por semana" {...register('max_horas_semana')} error={errors.max_horas_semana} />
            <Input type="number" label="Máx. horas por día" {...register('max_horas_dia')} error={errors.max_horas_dia} />
            <Select
              label="Autoridad de aprobación"
              options={[
                { value: 'RRHH', label: 'RRHH' },
                { value: 'GERENCIA', label: 'Gerencia Municipal' },
                { value: 'TITULAR', label: 'Titular del pliego' },
              ]}
              value={watch('autoridad_aprobacion') || 'RRHH'}
              onChange={(e) => setValue('autoridad_aprobacion', e.target.value)}
              error={errors.autoridad_aprobacion}
            />
            <Input label="Tipo de sustento" {...register('tipo_sustento')} error={errors.tipo_sustento} />
            <Input label="Base legal" {...register('base_legal')} error={errors.base_legal} />
            <Input
              type="number"
              label="Plazo de regularización (días)"
              {...register('plazo_regularizacion_dias')}
              error={errors.plazo_regularizacion_dias}
            />

            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'con_goce', label: 'Con goce' },
                { name: 'requiere_sustento', label: 'Requiere sustento' },
                { name: 'permite_regularizar', label: 'Permite regularizar' },
                { name: 'dias_calendario', label: 'Días calendario' },
                { name: 'ajustar_siguiente_habil', label: 'Trasladar al siguiente día hábil' },
                { name: 'anticipacion_dias_habiles', label: 'Anticipación en días hábiles' },
                { name: 'permite_mismo_dia', label: 'Permite solicitud el mismo día' },
                { name: 'requiere_entrega_cargo', label: 'Requiere entrega de cargo' },
                { name: 'activo', label: 'Activo' },
              ].map((f) => (
                <label key={f.name} className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input type="checkbox" {...register(f.name)} className="rounded border-border text-primary-600 focus:ring-primary-500" />
                  {f.label}
                </label>
              ))}
            </div>

            {editing && (
              <div className="md:col-span-2 pt-4 border-t border-border space-y-4">
                <div>
                  <h3 className="font-semibold text-text">Reglas condicionales</h3>
                  <p className="text-sm text-text-muted">
                    Condiciones que el servidor puede declarar al solicitar. Los días extra se suman al plazo.
                    Si dos condiciones comparten grupo, solo se podrá elegir una.
                  </p>
                </div>

                {condiciones.length === 0 ? (
                  <p className="text-sm text-text-muted">Este tipo aún no tiene condiciones configuradas.</p>
                ) : (
                  <div className="space-y-2">
                    {condiciones.map((c) => (
                      <div
                        key={c.id_condicion}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border bg-slate-50/60"
                      >
                        <div className="text-sm">
                          <p className="font-medium text-text">
                            {c.nombre}
                            {!asBool(c.activo) && <span className="ml-2 text-xs text-red-600">(inactiva)</span>}
                          </p>
                          <p className="text-text-muted text-xs">
                            {c.codigo} · +{Number(c.dias_extra)} {asBool(c.dias_calendario) ? 'día(s) calendario' : 'día(s) hábil(es)'}
                            {c.grupo ? ` · grupo ${c.grupo}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => alternarCondicion(c)}>
                            {asBool(c.activo) ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => eliminarCondicion(c.id_condicion)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-dashed border-border">
                  <Input
                    label="Código"
                    value={nuevaCond.codigo}
                    onChange={(e) => setNuevaCond({ ...nuevaCond, codigo: e.target.value })}
                    placeholder="EJ. PARTO_MULTIPLE"
                  />
                  <Input
                    label="Nombre visible"
                    value={nuevaCond.nombre}
                    onChange={(e) => setNuevaCond({ ...nuevaCond, nombre: e.target.value })}
                  />
                  <Input
                    type="number"
                    label="Días extra"
                    value={nuevaCond.dias_extra}
                    onChange={(e) => setNuevaCond({ ...nuevaCond, dias_extra: e.target.value })}
                  />
                  <Input
                    label="Grupo (opcional)"
                    value={nuevaCond.grupo}
                    onChange={(e) => setNuevaCond({ ...nuevaCond, grupo: e.target.value })}
                    helper="Condiciones del mismo grupo son excluyentes."
                  />
                  <Input
                    label="Descripción (opcional)"
                    value={nuevaCond.descripcion}
                    onChange={(e) => setNuevaCond({ ...nuevaCond, descripcion: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm text-text cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      checked={nuevaCond.dias_calendario}
                      onChange={(e) => setNuevaCond({ ...nuevaCond, dias_calendario: e.target.checked })}
                      className="rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    Días calendario
                  </label>
                  <div className="sm:col-span-2">
                    <Button type="button" variant="outline" onClick={agregarCondicion} disabled={savingCond}>
                      <Plus className="w-4 h-4" />
                      {savingCond ? 'Guardando...' : 'Agregar condición'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-4 border-t border-border flex gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={cerrarForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">Tipos registrados</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tope</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {tipos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                    No hay tipos registrados. Cree el primero con «Nuevo tipo».
                  </td>
                </tr>
              ) : (
                tipos.map((t) => (
                  <tr key={t.id_tipo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text">{t.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text">{t.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text">{t.categoria}</td>
                    <td className="px-4 py-3 text-sm text-text">{t.unidad_medida}</td>
                    <td className="px-4 py-3 text-sm text-text">{t.max_por_solicitud ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge estado={asBool(t.activo) ? 'APROBADA_RRHH' : 'ANULADA'} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => editar(t)} className="!px-2.5 !min-h-[36px]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" onClick={() => eliminar(t.id_tipo)} className="!px-2.5 !min-h-[36px]">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
