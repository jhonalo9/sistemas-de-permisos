import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, Badge, useToast } from '@/components/common';
import { Edit2, Plus, Search } from 'lucide-react';
import { asBool } from '@/utils/format';

type ServidorForm = {
  dni: string;
  apellidos: string;
  nombres: string;
  id_unidad: string;
  id_cargo: string;
  id_jefe: string;
  id_usuario: string;
  estado: string;
};

const FORM_VACIO: ServidorForm = {
  dni: '',
  apellidos: '',
  nombres: '',
  id_unidad: '',
  id_cargo: '',
  id_jefe: '',
  id_usuario: '',
  estado: 'ACTIVO',
};

export default function Servidores() {
  const { toast } = useToast();
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [unidades, setUnidades] = React.useState<any[]>([]);
  const [cargos, setCargos] = React.useState<any[]>([]);
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [form, setForm] = React.useState<ServidorForm>(FORM_VACIO);
  const [saving, setSaving] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState('');

  const cargar = async () => {
    try {
      const [sRes, uRes, cRes, usRes] = await Promise.all([
        apiClient<any>('/admin/servidores'),
        apiClient<any>('/admin/unidades'),
        apiClient<any>('/admin/cargos'),
        apiClient<any>('/admin/usuarios'),
      ]);
      setServidores(sRes.data || []);
      setUnidades(uRes.data || []);
      setCargos(cRes.data || []);
      setUsuarios(usRes.data || []);
    } catch (e: any) {
      toast.error('Error al cargar servidores', e.mensaje);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEditing(null);
    setForm(FORM_VACIO);
    setShowForm(true);
  };

  const editar = (s: any) => {
    setEditing(s);
    setForm({
      dni: s.dni || '',
      apellidos: s.apellidos || '',
      nombres: s.nombres || '',
      id_unidad: String(s.id_unidad ?? ''),
      id_cargo: String(s.id_cargo ?? ''),
      id_jefe: String(s.id_jefe ?? ''),
      id_usuario: String(s.id_usuario ?? ''),
      estado: s.estado || 'ACTIVO',
    });
    setShowForm(true);
  };

  const cerrar = () => {
    setShowForm(false);
    setEditing(null);
    setForm(FORM_VACIO);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        dni: form.dni.trim(),
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        id_unidad: form.id_unidad ? Number(form.id_unidad) : null,
        id_cargo: form.id_cargo ? Number(form.id_cargo) : null,
        id_jefe: form.id_jefe ? Number(form.id_jefe) : null,
        id_usuario: form.id_usuario ? Number(form.id_usuario) : null,
        estado: form.estado,
      };

      if (editing) {
        await apiClient(`/admin/servidores/${editing.id_servidor}`, { method: 'PUT', body });
        toast.success('Servidor actualizado', '');
      } else {
        await apiClient('/admin/servidores', { method: 'POST', body });
        toast.success('Servidor creado', '');
      }
      cerrar();
      cargar();
    } catch (err: any) {
      toast.error('Error al guardar', err.mensaje);
    } finally {
      setSaving(false);
    }
  };

  const usuariosDisponibles = usuarios.filter((u) => {
    if (!u.id_servidor) return true;
    return editing && String(u.id_servidor) === String(editing.id_servidor);
  });

  const filtrados = servidores.filter((s) => {
    const q = busqueda.toLowerCase();
    return (
      !q ||
      s.dni?.includes(q) ||
      `${s.apellidos} ${s.nombres}`.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Servidores</h1>
          <p className="text-gray-600">Gestione datos, unidad, cargo, jefe y usuario vinculado.</p>
        </div>
        <Button variant="primary" onClick={abrirNuevo}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo servidor
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">
              {editing ? 'Editar servidor' : 'Nuevo servidor'}
            </h2>
            <Button variant="outline" onClick={cerrar}>Cerrar</Button>
          </div>
          <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="DNI"
              value={form.dni}
              maxLength={8}
              onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })}
            />
            <Input
              label="Apellidos"
              value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            />
            <Input
              label="Nombres"
              value={form.nombres}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            />
            <div>
              <label className="label">Unidad orgánica</label>
              <select
                className="select-field"
                value={form.id_unidad}
                onChange={(e) => setForm({ ...form, id_unidad: e.target.value })}
              >
                <option value="">Seleccione</option>
                {unidades.filter((u) => !('activo' in u) || asBool(u.activo)).map((u) => (
                  <option key={u.id_unidad} value={u.id_unidad}>{u.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cargo</label>
              <select
                className="select-field"
                value={form.id_cargo}
                onChange={(e) => setForm({ ...form, id_cargo: e.target.value })}
              >
                <option value="">Sin cargo</option>
                {cargos.filter((c) => asBool(c.activo)).map((c) => (
                  <option key={c.id_cargo} value={c.id_cargo}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Jefe inmediato</label>
              <select
                className="select-field"
                value={form.id_jefe}
                onChange={(e) => setForm({ ...form, id_jefe: e.target.value })}
              >
                <option value="">Sin jefe</option>
                {servidores
                  .filter((s) => !editing || String(s.id_servidor) !== String(editing.id_servidor))
                  .map((s) => (
                    <option key={s.id_servidor} value={s.id_servidor}>
                      {s.apellidos}, {s.nombres} ({s.dni})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">Usuario vinculado</label>
              <select
                className="select-field"
                value={form.id_usuario}
                onChange={(e) => setForm({ ...form, id_usuario: e.target.value })}
              >
                <option value="">Sin usuario</option>
                {usuariosDisponibles.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.username} — {u.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="select-field"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                <option value="ACTIVO">Activo</option>
                <option value="CESADO">Cesado</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2 pt-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Actualizar servidor' : 'Crear servidor'}
              </Button>
              <Button type="button" variant="outline" onClick={cerrar}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="input-field"
            placeholder="Buscar por DNI, apellidos o nombres"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">DNI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jefe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtrados.map((s) => (
                <tr key={s.id_servidor} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-text">{s.apellidos}, {s.nombres}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.dni}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.unidad || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.cargo || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.jefe_nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text">{s.usuario_username || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge estado={s.estado === 'ACTIVO' ? 'APROBADA_RRHH' : 'ANULADA'} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button variant="outline" onClick={() => editar(s)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron servidores.
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
