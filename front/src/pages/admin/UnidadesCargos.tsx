import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, Badge, useToast } from '@/components/common';
import { Edit2, Plus } from 'lucide-react';
import { asBool } from '@/utils/format';

export default function UnidadesCargos() {
  const { toast } = useToast();
  const [unidades, setUnidades] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<any>(null);
  const [nombre, setNombre] = React.useState('');
  const [idPadre, setIdPadre] = React.useState('');
  const [activo, setActivo] = React.useState(true);

  const cargar = async () => {
    try {
      const res = await apiClient<any>('/admin/unidades');
      setUnidades(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar unidades', e.mensaje);
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
    setIdPadre('');
    setActivo(true);
  };

  const editar = (u: any) => {
    setEditing(u);
    setNombre(u.nombre || '');
    setIdPadre(String(u.id_padre ?? ''));
    setActivo(asBool(u.activo));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Nombre requerido', 'Ingrese el nombre de la unidad.');
      return;
    }

    const body = {
      nombre: nombre.trim(),
      id_padre: idPadre ? Number(idPadre) : null,
      activo: activo ? 1 : 0,
    };

    try {
      if (editing) {
        await apiClient(`/admin/unidades/${editing.id_unidad}`, { method: 'PUT', body });
        toast.success('Unidad actualizada', '');
      } else {
        await apiClient('/admin/unidades', { method: 'POST', body });
        toast.success('Unidad creada', '');
      }
      limpiar();
      cargar();
    } catch (err: any) {
      toast.error('Error al guardar', err.mensaje);
    }
  };

  const arbol = React.useMemo(() => {
    const resultado: any[] = [];
    const visitados = new Set<number>();

    const visitar = (padre: number | null, profundidad: number) => {
      unidades
        .filter((u) => (u.id_padre === null ? null : Number(u.id_padre)) === padre)
        .forEach((u) => {
          const id = Number(u.id_unidad);
          if (visitados.has(id)) return;
          visitados.add(id);
          resultado.push({ ...u, _depth: profundidad });
          visitar(id, profundidad + 1);
        });
    };

    visitar(null, 0);
    unidades.forEach((u) => {
      const id = Number(u.id_unidad);
      if (!visitados.has(id)) {
        visitados.add(id);
        resultado.push({ ...u, _depth: 0 });
      }
    });
    return resultado;
  }, [unidades]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Unidades orgánicas</h1>
          <p className="text-gray-600">Administre la estructura jerárquica de unidades.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Unidades registradas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {arbol.length > 0 ? (
                    arbol.map((u) => (
                      <tr key={u.id_unidad} className="hover:bg-gray-50">
                        <td
                          className="px-4 py-3 text-sm text-text"
                          style={{ paddingLeft: `${16 + Number(u._depth) * 20}px` }}
                        >
                          {u._depth > 0 ? '↳ ' : ''}{u.nombre}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge estado={asBool(u.activo) ? 'APROBADA_RRHH' : 'ANULADA'} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button variant="outline" onClick={() => editar(u)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No hay unidades registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">
              {editing ? 'Editar unidad' : 'Nueva unidad'}
            </h2>
            <form onSubmit={guardar} className="space-y-4">
              <Input
                label="Nombre de unidad"
                placeholder="Ej. Gerencia de Finanzas"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <div>
                <label className="label">Unidad padre</label>
                <select
                  className="select-field"
                  value={idPadre}
                  onChange={(e) => setIdPadre(e.target.value)}
                >
                  <option value="">Sin unidad padre</option>
                  {unidades
                    .filter((u) => !editing || Number(u.id_unidad) !== Number(editing.id_unidad))
                    .map((u) => (
                      <option key={u.id_unidad} value={u.id_unidad}>{u.nombre}</option>
                    ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4"
                />
                Unidad activa
              </label>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {editing ? 'Actualizar' : 'Crear unidad'}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={limpiar}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
