import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import Login from '@/pages/Login';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/common';
import {
  Home as ServidorHome,
  NuevaSolicitud,
  MisSolicitudes,
  DetalleSolicitud,
  MisSaldos,
  CompletarRegularizacion,
} from '@/pages/servidor';
import {
  BandejaAprobaciones,
  DetalleAprobacion,
  MiEquipo,
} from '@/pages/jefe';
import {
  Panel,
  BandejaValidacion,
  ValidarSolicitud,
  EmisionPapeleta,
  Regularizaciones,
  Reportes,
} from '@/pages/rrhh';
import {
  Lectura,
  MarcacionManual,
  SalidaEmergencia,
  PersonalFuera,
  NoVolvieron,
} from '@/pages/control';
import {
  TiposSolicitud,
  UsuariosRoles,
  Feriados,
  UnidadesCargos,
  PuestosControl,
  Servidores,
  Cargos,
  Parametros,
} from '@/pages/admin';

function ProtectedRoute({ children, allowedRoles }: { children?: React.ReactNode; allowedRoles?: string[] }) {
  const { token, usuario } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && usuario && !allowedRoles.some((r) => usuario.roles.includes(r as any))) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold text-red-700">Acceso denegado</h2>
        <p className="text-gray-600">No tiene permisos para ver esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-bg">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/login" replace />} />

              <Route
                path="servidor/*"
                element={
                  <ProtectedRoute allowedRoles={['SERVIDOR', 'ADMIN']}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ServidorHome />} />
                <Route path="nueva" element={<NuevaSolicitud />} />
                <Route path="borradores/:id" element={<NuevaSolicitud />} />
                <Route path="mis-solicitudes" element={<MisSolicitudes />} />
                <Route path="mis-solicitudes/:id" element={<DetalleSolicitud />} />
                <Route path="mis-saldos" element={<MisSaldos />} />
                <Route path="regularizar" element={<CompletarRegularizacion />} />
              </Route>

              <Route
                path="jefe/*"
                element={
                  <ProtectedRoute allowedRoles={['JEFE', 'ADMIN']}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<BandejaAprobaciones />} />
                <Route path="aprobaciones" element={<BandejaAprobaciones />} />
                <Route path="aprobaciones/:id" element={<DetalleAprobacion />} />
                <Route path="equipo" element={<MiEquipo />} />
              </Route>

              <Route
                path="rrhh/*"
                element={
                  <ProtectedRoute allowedRoles={['RRHH', 'ADMIN']}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Panel />} />
                <Route path="panel" element={<Panel />} />
                <Route path="bandeja" element={<BandejaValidacion />} />
                <Route path="bandeja/:id" element={<ValidarSolicitud />} />
                <Route path="papeleta/:id" element={<EmisionPapeleta />} />
                <Route path="regularizaciones" element={<Regularizaciones />} />
                <Route path="reportes" element={<Reportes />} />
              </Route>

              <Route
                path="control/*"
                element={
                  <ProtectedRoute allowedRoles={['CONTROL', 'RRHH', 'ADMIN']}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Lectura />} />
                <Route path="lectura" element={<Lectura />} />
                <Route path="manual" element={<MarcacionManual />} />
                <Route path="emergencia" element={<SalidaEmergencia />} />
                <Route path="fuera" element={<PersonalFuera />} />
                <Route path="no-volvieron" element={<NoVolvieron />} />
              </Route>

              <Route
                path="admin/*"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TiposSolicitud />} />
                <Route path="tipos" element={<TiposSolicitud />} />
                <Route path="usuarios" element={<UsuariosRoles />} />
                <Route path="feriados" element={<Feriados />} />
                <Route path="unidades" element={<UnidadesCargos />} />
                <Route path="puestos" element={<PuestosControl />} />
                <Route path="servidores" element={<Servidores />} />
                <Route path="cargos" element={<Cargos />} />
                <Route path="parametros" element={<Parametros />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
