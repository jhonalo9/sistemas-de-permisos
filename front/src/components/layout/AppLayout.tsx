import React from 'react';
import {
  LogOut,
  Menu,
  Home,
  User,
  FileCheck,
  Building,
  ShieldAlert,
  Clock,
  LayoutDashboard,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';

const navItems = [
  { href: '/servidor', label: 'Inicio', icon: Home },
  { href: '/servidor/nueva', label: 'Nueva solicitud', icon: FileCheck },
  { href: '/servidor/mis-solicitudes', label: 'Mis solicitudes', icon: User },
  { href: '/servidor/regularizar', label: 'Regularizar salidas', icon: Clock },
  { href: '/servidor/mis-saldos', label: 'Mis saldos', icon: Building },
];

const jefeItems = [
  { href: '/jefe/aprobaciones', label: 'Bandeja de aprobaciones', icon: FileCheck },
  { href: '/jefe/equipo', label: 'Mi equipo', icon: User },
];

const rrhhItems = [
  { href: '/rrhh/panel', label: 'Panel de indicadores', icon: LayoutDashboard },
  { href: '/rrhh/bandeja', label: 'Bandeja de validación', icon: FileCheck },
  { href: '/rrhh/regularizaciones', label: 'Regularizaciones', icon: Clock },
  { href: '/rrhh/reportes', label: 'Reportes', icon: LayoutDashboard },
];

const adminItems = [
  { href: '/admin/tipos', label: 'Catálogo de tipos', icon: Building },
  { href: '/admin/usuarios', label: 'Usuarios y roles', icon: User },
  { href: '/admin/servidores', label: 'Servidores', icon: User },
  { href: '/admin/unidades', label: 'Unidades orgánicas', icon: Building },
  { href: '/admin/cargos', label: 'Cargos', icon: Building },
  { href: '/admin/puestos', label: 'Puestos de control', icon: LayoutDashboard },
  { href: '/admin/parametros', label: 'Parámetros', icon: LayoutDashboard },
];

const controlItems = [
  { href: '/control/lectura', label: 'Lectura de marcaciones', icon: Clock },
  { href: '/control/manual', label: 'Marcación manual', icon: FileCheck },
  { href: '/control/emergencia', label: 'Salida de emergencia', icon: ShieldAlert },
  { href: '/control/fuera', label: 'Personal fuera', icon: User },
  { href: '/control/no-volvieron', label: 'No volvieron', icon: Clock },
];

function getNavItems(roles: string[]) {
  if (roles.includes('ADMIN')) return adminItems;
  if (roles.includes('RRHH')) return rrhhItems;
  if (roles.includes('JEFE')) return jefeItems;
  if (roles.includes('CONTROL')) return controlItems;
  return navItems;
}

function isActivePath(pathname: string, href: string) {
  if (
    href === '/servidor' ||
    href === '/rrhh/panel' ||
    href === '/jefe/aprobaciones' ||
    href === '/control/lectura' ||
    href === '/admin/tipos'
  ) {
    return (
      pathname === href ||
      pathname === href.replace(/\/(panel|aprobaciones|lectura|tipos)$/, '') ||
      pathname === href + '/'
    );
  }
  return pathname === href || pathname.startsWith(href + '/');
}

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const { usuario, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getNavItems(usuario?.roles || []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-700 via-primary-600 to-primary-800 text-white hidden lg:flex lg:flex-col shadow-elevated">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-soft">
            <Building className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight leading-none">MUNI SOL</span>
            <p className="text-[11px] text-primary-100/80 mt-0.5 font-medium">Permisos y Licencias</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-primary-200/70">
          Menú principal
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(location.pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`nav-item ${active ? 'nav-item-active' : 'nav-item-idle'}`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-primary-200'}`} />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
            {getInitials(usuario?.nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{usuario?.nombre || 'Usuario'}</p>
            <p className="text-[11px] text-primary-200 truncate capitalize">
              {usuario?.roles?.join(' · ') || ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/20 hover:text-red-100 rounded-xl transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { usuario } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border/80">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 text-text-muted hover:text-text hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
            <span className="text-sm font-medium text-text-muted">Sistema en línea</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-semibold text-text leading-tight">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-xs text-text-muted capitalize">{usuario?.roles?.join(', ') || ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
              {getInitials(usuario?.nombre)}
            </div>
          </div>
          <div className="md:hidden w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
            {getInitials(usuario?.nombre)}
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { clearSession, usuario } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getNavItems(usuario?.roles || []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-elevated flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-text">MUNI SOL</span>
              <p className="text-[10px] text-text-muted">Permisos y Licencias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:bg-slate-100 hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(location.pathname, item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-muted hover:bg-slate-50 hover:text-text'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-primary-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
              {getInitials(usuario?.nombre)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-xs text-text-muted truncate capitalize">{usuario?.roles?.join(' · ') || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar onMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
