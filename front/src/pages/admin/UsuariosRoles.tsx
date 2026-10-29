import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, Input, useToast } from '@/components/common';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usuarioSchema } from '@/utils/validations';
import { Table, Badge } from '@/components/common';
import { User, Shield, Plus, Edit2 } from 'lucide-react';
import { errorMessage, asBool } from '@/utils/format';

const ROLES = ['SERVIDOR', 'JEFE', 'RRHH', 'CONTROL', 'ADMIN'];

export default function UsuariosRoles() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [editing, setEditing] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      username: '',
      password: '',
      nombre: '',
      id_servidor: '',
      roles: [],
    },
  });

  const cargar = async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        apiClient<any>('/admin/usuarios'),
        apiClient<any>('/admin/servidores'),
      ]);
      setUsuarios(uRes.data || []);
      setServidores(sRes.data || []);
    } catch (e: any) {
      toast.error('Error al cargar usuarios', e.mensaje);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (datos: any) => {
    if (!editing && !datos.password) {
      toast.error('Contraseña requerida', 'Debe indicar una contraseña para el nuevo usuario.');
      return;
    }
    if (datos.password && String(datos.password).length < 6) {
      toast.error('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      if (editing) {
        await apiClient<any>(`/admin/usuarios/${editing.id_usuario}`, {
          method: 'PUT',
          body: datos,
        });
        toast.success('Usuario actualizado', 'El usuario se ha actualizado.');
      } else {
        await apiClient<any>('/admin/usuarios', {
          method: 'POST',
          body: datos,
        });
        toast.success('Usuario creado', 'El usuario se ha creado.');
      }
      setEditing(null);
      setShowForm(false);
      reset();
      cargar();
    } catch (e: any) {
      toast.error('Error al guardar', e.mensaje);
    }
  };

  const toggleActivo = async (usuario: any) => {
    try {
      await apiClient<any>(`/admin/usuarios/${usuario.id_usuario}`, {
        method: 'PUT',
        body: { activo: asBool(usuario.activo) ? 0 : 1 },
      });
      toast.success(asBool(usuario.activo) ? 'Usuario desactivado' : 'Usuario activado', '');
      cargar();
    } catch (e: any) {
      toast.error('Error al cambiar estado', e.mensaje);
    }
  };

  const editar = (u: any) => {
    setEditing(u);
    setShowForm(true);
    reset({
      username: u.username,
      password: '',
      nombre: u.nombre,
      id_servidor: u.id_servidor ?? '',
      roles: u.roles || [],
    });
  };

  const asignarRoles = async (idUsuario: number, roles: string[]) => {
    try {
      await apiClient<any>(`/admin/usuarios/${idUsuario}/roles`, {
        method: 'POST',
        body: { roles },
      });
      toast.success('Roles asignados', 'Los roles se han actualizado.');
      cargar();
    } catch (e: any) {
      toast.error('Error al asignar roles', e.mensaje);
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Usuarios y roles</h1>
          <p className="text-gray-600">Administre usuarios y asigne roles del sistema.</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); reset(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      {(showForm || editing) && (
        <Card>
          <h2 className="text-lg font-semibold text-text mb-4">
            {editing ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Usuario (username)"
              {...register('username')}
              error={errors.username}
            />
            <Input
              type="password"
              label="Contraseña"
              {...register('password')}
              error={errors.password}
              helper={editing ? 'Déjelo vacío para no cambiar' : 'Mínimo 6 caracteres'}
            />
            <Input
              label="Nombre completo"
              {...register('nombre')}
              error={errors.nombre}
            />
            <div className="mb-4">
              <label className="label">Servidor vinculado</label>
              <select
                className="select-field"
                value={watch('id_servidor') ? String(watch('id_servidor')) : ''}
                onChange={(e) => setValue('id_servidor', e.target.value)}
              >
                <option value="">Sin servidor</option>
                {servidores
                  .filter((s) => !s.id_usuario || (editing && String(s.id_servidor) === String(editing.id_servidor)))
                  .map((s) => (
                    <option key={s.id_servidor} value={s.id_servidor}>
                      {s.apellidos}, {s.nombres} ({s.dni})
                    </option>
                  ))}
              </select>
              <p className="helper-text">Un servidor solo puede tener un usuario vinculado.</p>
            </div>
            <div className="mb-4">
              <label className="label">Roles</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ROLES.map((rol) => (
                  <label key={rol} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={getValues('roles')?.includes(rol)}
                      onChange={(e) => {
                        const current = getValues('roles') || [];
                        if (e.target.checked) {
                          setValue('roles', [...current, rol]);
                        } else {
                          setValue('roles', current.filter((r: string) => r !== rol));
                        }
                      }}
                    />
                    <span className="text-sm">{rol}</span>
                  </label>
                ))}
              </div>
              {errors.roles && <p className="error-text">{errorMessage(errors.roles)}</p>}
            </div>
            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <Button type="submit" variant="primary">
                {editing ? 'Actualizar' : 'Crear'}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(null); setShowForm(false); reset(); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">Usuarios registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((u) => (
                <tr key={u.id_usuario} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-text">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-text">{u.nombre}</td>
                  <td className="px-4 py-3 text-sm text-text">
                    {(u.roles || []).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => toggleActivo(u)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${asBool(u.activo) ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {asBool(u.activo) ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button variant="outline" onClick={() => editar(u)}>
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
