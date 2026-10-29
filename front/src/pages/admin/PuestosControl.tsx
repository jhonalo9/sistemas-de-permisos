import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, Badge, useToast } from '@/components/common';
import { Plus, Edit2 } from 'lucide-react';
import { asBool } from '@/utils/format';

export default function PuestosControl() {
  const { toast } = useToast();
  const [puestos, setPuestos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<any>(null);
  const [nombre, setNombre] = React.useState('');
  const [ubicacion, setUbicacion] = React.useState('');
  const [activo, setActivo] = React.useState(true);

  const cargar = async () => {
    try {
      const res = await apiClient<any>('/admin/puestos');
      setPuestos(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar puestos', e.mensaje);
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
    setUbicacion('');
    setActivo(true);
  };

  const editar = (p: any) => {
    setEditing(p);
    setNombre(p.nombre || '');
    setUbicacion(p.ubicacion || '');
    setActivo(asBool(p.activo));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Nombre requerido', 'Ingrese el nombre del puesto.');
      return;
    }
    const body = { nombre: nombre.trim(), ubicacion: ubicacion.trim(), activo: activo ? 1 : 0 };
    try {
      if (editing) {
        await apiClient(`/admin/puestos/${editing.id_puesto}`, { method: 'PUT', body });
        toast.success('Puesto actualizado', '');
      } else {
        await apiClient('/admin/puestos', { method: 'POST', body });
        toast.success('Puesto creado', '');
      }
      limpiar();
      cargar();
    } catch (err: any) {
      toast.error('Error al guardar', err.mensaje);
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
        <h1 className="text-2xl font-bold text-text">Puestos de control</h1>
        <p className="text-gray-600">Administre los puestos de control de marcación.</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">
          {editing ? 'Editar puesto' : 'Nuevo puesto de control'}
        </h2>
        <form onSubmit={guardar} className="space-y-4">
          <Input
            label="Nombre del puesto"
            placeholder="Ej. Control Principal"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            label="Ubicación"
            placeholder="Ej. Puerta principal - Av. Larco"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4"
            />
            Puesto activo
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              {editing ? 'Actualizar' : 'Crear puesto'}
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
        <h2 className="text-lg font-semibold text-text mb-4">Puestos registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {puestos.length > 0 ? (
                puestos.map((p) => (
                  <tr key={p.id_puesto} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-text">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text">{p.ubicacion || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge estado={asBool(p.activo) ? 'APROBADA_RRHH' : 'ANULADA'} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button variant="outline" onClick={() => editar(p)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No hay puestos de control registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
