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
  requiere_sustento: true,
  permite_regularizar: false,
  dias_calendario: true,
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
    reset(defaultValues);
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditing(null);
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
      requiere_sustento: asBool(tipo.requiere_sustento),
      permite_regularizar: asBool(tipo.permite_regularizar),
      dias_calendario: asBool(tipo.dias_calendario),
      base_legal: tipo.base_legal ?? '',
      plazo_regularizacion_dias: tipo.plazo_regularizacion_dias ?? '',
      activo: asBool(tipo.activo),
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
                { name: 'activo', label: 'Activo' },
              ].map((f) => (
                <label key={f.name} className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input type="checkbox" {...register(f.name)} className="rounded border-border text-primary-600 focus:ring-primary-500" />
                  {f.label}
                </label>
              ))}
            </div>

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
