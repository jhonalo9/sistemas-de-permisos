export function formatearFecha(fecha?: string | Date | null, formato: string = 'dd/MM/yyyy'): string {
  if (fecha == null || fecha === '') return '—';

  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (!(d instanceof Date) || isNaN(d.getTime())) return '—';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();

  if (formato === 'dd/MM/yyyy') return `${dia}/${mes}/${anio}`;
  if (formato === 'yyyy-MM-dd') return `${anio}-${mes}-${dia}`;
  return `${dia}/${mes}/${anio}`;
}





export function formatearHora(hora?: string | null): string {
  if (!hora) return '';
  return hora.substring(0, 5);
}

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'decimal', minimumFractionDigits: 2 }).format(valor);
}

export function calcularDiasEntre(fechaInicio: string, fechaFin: string): number {
  const ini = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return 0;
  const diffMs = fin.getTime() - ini.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function calcularHorasEntre(horaInicio: string, horaFin: string): number {
  if (!horaInicio || !horaFin) return 0;
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);
  const iniMin = hi * 60 + mi;
  const finMin = hf * 60 + mf;
  const diff = finMin - iniMin;
  return diff > 0 ? diff / 60 : 0;
}

export function estadoColor(estado: string): string {
  const map: Record<string, string> = {
    BORRADOR: 'bg-estado-borrador',
    REGULARIZAR: 'bg-estado-regularizar',
    PENDIENTE: 'bg-estado-pendiente',
    OBSERVADA: 'bg-estado-observada',
    APROBADA_JEFE: 'bg-estado-aprobada_jefe',
    APROBADA_RRHH: 'bg-estado-aprobada_rrhh',
    EN_CURSO: 'bg-estado-en_curso',
    EJECUTADA: 'bg-estado-ejecutada',
    RECHAZADA: 'bg-estado-rechazada',
    ANULADA: 'bg-estado-anulada',
  };
  return map[estado] || 'bg-gray-500';
}

export function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    BORRADOR: 'Borrador',
    REGULARIZAR: 'Por regularizar',
    PENDIENTE: 'Pendiente',
    OBSERVADA: 'Observada',
    APROBADA_JEFE: 'Aprobada Jefe',
    APROBADA_RRHH: 'Aprobada RRHH',
    EN_CURSO: 'En curso',
    EJECUTADA: 'Ejecutada',
    RECHAZADA: 'Rechazada',
    ANULADA: 'Anulada',
  };
  return map[estado] || estado || '—';
}

export function diasRestantes(fechaLimite?: string | null): number {
  if (!fechaLimite) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  if (isNaN(limite.getTime())) return 0;
  limite.setHours(0, 0, 0, 0);
  const diffMs = limite.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function esVencida(fechaLimite?: string | null): boolean {
  if (!fechaLimite) return false;
  return diasRestantes(fechaLimite) < 0;
}

export function categoriaLabel(categoria: string): string {
  return categoria === 'LICENCIA' ? 'Licencia' : 'Permiso';
}

export function unidadLabel(unidad?: string | null): string {
  return unidad === 'DIAS' ? 'Días' : 'Horas';
}

export function errorMessage(err: any): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && err.message) return err.message;
  if (err && typeof err === 'object' && err.mensaje) return err.mensaje;
  return '';
}

export function asBool(valor: any): boolean {
  return valor === true || valor === 1 || valor === '1';
}

export function asNum(valor: any, defecto = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : defecto;
}
