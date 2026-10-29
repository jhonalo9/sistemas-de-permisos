export type Rol = 'SERVIDOR' | 'JEFE' | 'RRHH' | 'CONTROL' | 'ADMIN';

export type EstadoSolicitud =
  | 'BORRADOR'
  | 'REGULARIZAR'
  | 'PENDIENTE'
  | 'OBSERVADA'
  | 'APROBADA_JEFE'
  | 'APROBADA_RRHH'
  | 'EN_CURSO'
  | 'RECHAZADA'
  | 'ANULADA'
  | 'EJECUTADA';

export type TipoSolicitud = {
  id_tipo: number;
  codigo: string;
  nombre: string;
  categoria: 'LICENCIA' | 'PERMISO';
  con_goce: boolean;
  unidad_medida: 'DIAS' | 'HORAS';
  max_por_solicitud: number | null;
  max_por_anio: number | null;
  requiere_sustento: boolean;
  solo_sexo: string | null;
  permite_regularizar: boolean;
  dias_calendario: boolean;
  base_legal: string | null;
  plazo_regularizacion_dias: number | null;
  activo: boolean;
};

export type Usuario = {
  id_usuario: number;
  nombre: string;
  username: string;
  id_servidor: number | null;
  roles: Rol[];
};

export type Solicitud = {
  id_solicitud: number;
  nro_solicitud: string;
  id_servidor: number;
  id_tipo: number;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  cantidad: number;
  motivo: string | null;
  estado: EstadoSolicitud;
  token_codigo: string | null;
  es_urgente: boolean;
  fecha_limite_regularizacion: string | null;
  tiempo_empleado_min: number | null;
  mision_cumplida: number | null;
  id_usuario_visa: number | null;
  fecha_visa: string | null;
  nro_resolucion: string | null;
  fecha_resolucion: string | null;
  creado_en: string;
  actualizado_en: string;
  tipo?: TipoSolicitud;
  servidor?: Servidor;
  adjuntos?: Adjunto[];
  historial?: Historial[];
};

export type Servidor = {
  id_servidor: number;
  dni: string;
  apellidos: string;
  nombres: string;
  id_unidad: number;
  id_jefe: number | null;
  cargo: string | null;
  estado: string;
};

export type Adjunto = {
  id_adjunto: number;
  id_solicitud: number;
  nombre_arch: string;
  ruta_arch: string;
  mime: string | null;
  tamano_bytes: number | null;
  confidencial: boolean;
  subido_en: string;
};

export type Historial = {
  id_hist: number;
  id_solicitud: number;
  estado_ant: string | null;
  estado_new: string;
  id_usuario: number;
  comentario: string | null;
  creado_en: string;
};

export type Saldo = {
  id_saldo: number;
  id_servidor: number;
  id_tipo: number;
  anio: number;
  asignado: number;
  usado: number;
  tipo?: TipoSolicitud;
};

export type MarcacionResultado = {
  exito: boolean;
  servidor?: Servidor;
  tipo?: string;
  fecha_hora?: string;
  tiempo_empleado_min?: number;
  mensaje?: string;
};

export type ApiResponse<T = any> = {
  ok: boolean;
  data?: T;
  mensaje?: string;
  codigo_error?: number;
  total?: number;
  page?: number;
  per_page?: number;
};
