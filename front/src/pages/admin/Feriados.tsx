import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, useToast } from '@/components/common';
import { Plus, Trash2 } from 'lucide-react';

export default function Feriados() {
  const { toast } = useToast();
  const [feriados, setFeriados] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fecha, setFecha] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');

  const cargar = async () => {
    try {
      const res = await apiClient<any>('/admin/feriados');
      setFeriados(res.data || []);
    } catch (e: any) {
      toast.error('Error al cargar feriados', e.mensaje);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crear = async (fecha: string, descripcion: string) => {
    try {
      await apiClient<any>('/admin/feriados', {
        method: 'POST',
        body: { fecha, descripcion },
      });
      toast.success('Feriado creado', 'El feriado se ha registrado.');
      cargar();
    } catch (e: any) {
      toast.error('Error al crear', e.mensaje);
    }
  };

  const agregar = async () => {
    if (!fecha || !descripcion.trim()) {
      toast.error('Datos incompletos', 'Ingrese fecha y descripción.');
      return;
    }
    await crear(fecha, descripcion.trim());
    setFecha('');
    setDescripcion('');
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este feriado?')) return;
    try {
      await apiClient<any>(`/admin/feriados/${id}`, {
        method: 'DELETE',
      });
      toast.success('Feriado eliminado', '');
      cargar();
    } catch (e: any) {
      toast.error('Error al eliminar', e.mensaje);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Feriados</h1>
          <p className="text-gray-600">Administre los feriados del calendario anual.</p>
        </div>
        <Button variant="primary" onClick={() => { setFecha(''); setDescripcion(''); }} className="hidden sm:inline-flex">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo feriado
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Fecha</label>
          <input
            type="date"
            className="input-field"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Descripción</label>
          <input
            type="text"
            placeholder="Ej. Año Nuevo"
            className="input-field"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Button variant="primary" onClick={agregar}>
            Agregar feriado
          </Button>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">Feriados registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feriados.length > 0 ? (
                feriados.map((f) => (
                  <tr key={f.id_feriado} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-text">{f.fecha}</td>
                    <td className="px-4 py-3 text-sm text-text">{f.descripcion}</td>
                    <td className="px-4 py-3 text-sm">
                      <Button variant="outline" onClick={() => eliminar(f.id_feriado)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No hay feriados registrados.
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
