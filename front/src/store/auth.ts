import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Usuario, Rol } from '@/types';

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  idServidor: number | null;
  isLoading: boolean;
  setSession: (token: string, usuario: Usuario) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  tieneRol: (rol: Rol) => boolean;
  tieneAlgunRol: (roles: Rol[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      idServidor: null,
      isLoading: false,
      setSession: (token, usuario) => set({ token, usuario, idServidor: usuario.id_servidor ?? null }),
      clearSession: () => set({ token: null, usuario: null, idServidor: null }),
      setLoading: (isLoading) => set({ isLoading }),
      tieneRol: (rol: Rol) => {
        const { usuario } = get();
        return !!usuario && usuario.roles.includes(rol);
      },
      tieneAlgunRol: (roles: Rol[]) => {
        const { usuario } = get();
        return !!usuario && roles.some((r) => usuario.roles.includes(r));
      },
    }),
    {
      name: 'permiso-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
