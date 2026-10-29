import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, Badge, useToast } from '@/components/common';
import { asBool } from '@/utils/format';
import { Edit2, Plus } from 'lucide-react';

export default function Cargos() {
  const { toast } = useToast();
  const [cargos, setCargos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<any>(null);
  const [nombre, setNombre] = React.useState('');
  const [activo, setActivo] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const cargar = async () => {
    try {
      const res = await apiClient<any>('/admin/cargos');
      setCargos(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar cargos', e.mensaje);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargar();
  }, []);

  const limpiar = () => {
    setEditing(null);
    setNombre('');
    setActivo(true);
  };

  const editar = (c: any) => {
    setEditing(c);
    setNombre(c.nombre || '');
    setActivo(asBool(c.activo));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Nombre requerido', 'Ingrese el nombre del cargo.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient(`/admin/cargos/${editing.id_cargo}`, {
          method: 'PUT',
          body: { nombre: nombre.trim(), activo: activo ? 1 : 0 },
        });
        toast.success('Cargo actualizado', '');
      } else {
        await apiClient('/admin/cargos', {
          method: 'POST',
          body: { nombre: nombre.trim(), activo: activo ? 1 : 0 },
        });
        toast.success('Cargo creado', '');
      }
      limpiar();
      cargar();
    } catch (err: any) {
      toast.error('Error al guardar', err.mensaje);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Cargos</h1>
        <p className="text-gray-600">Catálogo de cargos usado en papeletas y reportes.</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">
          {editing ? 'Editar cargo' : 'Nuevo cargo'}
        </h2>
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Nombre del cargo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Asistente administrativo"
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded border-border text-primary-600"
            />
            Activo
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear cargo'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={limpiar}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">Cargos registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargos.map((c) => (
                <tr key={c.id_cargo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-text">{c.nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge estado={asBool(c.activo) ? 'APROBADA_RRHH' : 'ANULADA'} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button variant="outline" onClick={() => editar(c)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
