import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/utils/validations';
import { errorMessage } from '@/utils/format';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/common';
import { Building, Shield, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const redirectByRole = (roles: string[]) => {
    if (roles.includes('ADMIN')) return navigate('/admin');
    if (roles.includes('RRHH')) return navigate('/rrhh/panel');
    if (roles.includes('JEFE')) return navigate('/jefe/aprobaciones');
    if (roles.includes('CONTROL')) return navigate('/control/lectura');
    return navigate('/servidor');
  };

  const onSubmit = async (datos: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<any>('/auth/login', {
        method: 'POST',
        body: datos,
      });
      if (res.ok) {
        const data = res as any;
        setSession(data.token, data.usuario);
        redirectByRole(data.usuario.roles);
      } else {
        setError(res.mensaje || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      setError(err.mensaje || `Error de conexión: ${err.type || 'red/CORS'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-600 to-primary-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-400/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-elevated">
             <img src="sol-logo.png" alt="" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">JOSÉ LEONARDO ORTIZ</span>
              <p className="text-xs text-primary-100/80 font-medium">Municipalidad Distrital</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-primary-50">
              <Shield className="w-4 h-4" />
              Acceso seguro
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Sistema de Permisos y Licencias
            </h1>
            <p className="text-primary-100/90 text-base leading-relaxed">
              Gestione solicitudes, aprobaciones y control de personal de forma ágil y transparente
              para la Municipalidad Distrital de José Leonardo Ortiz.
            </p>
            <div className="flex gap-6 pt-2">
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-primary-200">Disponible</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold">Seguro</p>
                <p className="text-xs text-primary-200">Roles y permisos</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold">Ágil</p>
                <p className="text-xs text-primary-200">Flujo digital</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-200/70">
            © {new Date().getFullYear()} Municipalidad Distrital de José Leonardo Ortiz
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-bg">
        <div className="w-full max-w-[400px] animate-slide-up">
          <div className="lg:hidden flex flex-col items-center gap-2.5 mb-8">
            <img
              src="/sol-logo.png"
              alt="Logo municipal"
              className="w-11 h-15 object-contain"
            />

            <div className="w-full">
              <span className="block text-center font-bold text-lg text-text">
                MUNICIPALIDAD DISTRITAL DE JOSÉ LEONARDO ORTIZ
              </span>
              <p className="text-[11px] text-center text-text-muted">
                Permisos y Licencias
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl  text-center font-bold text-text tracking-tight">Iniciar sesión</h2>
            <p className="mt-1.5 text-center text-sm text-text-muted">
              Ingrese sus credenciales institucionales para continuar
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-text-soft" />
                </div>
                <input
                  {...register('username')}
                  autoComplete="username"
                  className={`input-field pl-10 ${
                    errorMessage(errors.username) ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : ''
                  }`}
                  placeholder="ej. jperez"
                />
              </div>
              {errorMessage(errors.username) && (
                <p className="error-text">{errorMessage(errors.username)}</p>
              )}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-text-soft" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className={`input-field pl-10 ${
                    errorMessage(errors.password) ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errorMessage(errors.password) && (
                <p className="error-text">{errorMessage(errors.password)}</p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full group" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>

            <p className="text-sm text-center text-text-muted pt-1">
              ¿Olvidó su contraseña?{' '}
              <button type="button" onClick={() => {}} className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                Recuperar acceso
              </button>
            </p>
          </form>

          <p className="mt-10 text-center text-[11px] text-text-soft lg:hidden">
            Municipalidad Distrital de José Leonardo Ortiz
          </p>
        </div>
      </div>
    </div>
  );
}
