import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Ingrese su usuario'),
  password: z.string().min(1, 'Ingrese su contraseña'),
});

export const solicitudSchema = z.object({
  id_tipo: z.coerce.number().int().positive('Seleccione un tipo de solicitud'),
  fecha_inicio: z.string().min(1, 'Fecha de inicio requerida'),
  fecha_fin: z.string().min(1, 'Fecha fin requerida'),
  hora_inicio: z.string().optional(),
  hora_fin: z.string().optional(),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
});

export const validarSchema = z.object({
  nro_resolucion: z.string().min(1, 'Número de resolución requerido'),
  fecha_resolucion: z.string().min(1, 'Fecha de resolución requerida'),
});

export const observarSchema = z.object({
  comentario: z.string().min(5, 'Indique el motivo de la observación'),
});

export const rechazarSchema = z.object({
  motivo: z.string().min(5, 'Indique el motivo del rechazo'),
});

export const manualSchema = z.object({
  codigo: z.string().min(1, 'Ingrese el N.º de solicitud'),
  observacion: z.string().min(5, 'La observación es obligatoria'),
});

export const emergenciaSchema = z.object({
  id_servidor: z.coerce.number().int().positive('Seleccione un servidor'),
  fecha_salida: z.string().min(1, 'Fecha de salida requerida'),
  hora_salida: z.string().min(1, 'Hora de salida requerida'),
  motivo: z.string().min(5, 'El motivo es obligatorio'),
  autorizado_por: z.string().min(1, 'Jefe que autoriza requerido'),
  observacion: z.string().min(1, 'Observación requerida'),
});

export const tipoSolicitudSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.enum(['LICENCIA', 'PERMISO']),
  con_goce: z.boolean(),
  unidad_medida: z.enum(['DIAS', 'HORAS']),
  max_por_solicitud: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional().nullable()),
  max_por_anio: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional().nullable()),
  requiere_sustento: z.boolean(),
  permite_regularizar: z.boolean(),
  dias_calendario: z.boolean(),
  base_legal: z.string().optional(),
  plazo_regularizacion_dias: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().int().positive().optional().nullable()),
  activo: z.boolean(),
});

export const usuarioSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  id_servidor: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().int().positive().optional().nullable()),
  roles: z.array(z.string()).min(1, 'Asigne al menos un rol'),
});

export const feriadoSchema = z.object({
  fecha: z.string().min(1, 'Fecha requerida'),
  descripcion: z.string().min(1, 'Descripción requerida'),
});

export const unidadSchema = z.object({
  nombre: z.string().min(1, 'Nombre de unidad requerido'),
  id_padre: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().int().positive().optional().nullable()),
  activo: z.boolean(),
});

export const puestoSchema = z.object({
  nombre: z.string().min(1, 'Nombre de puesto requerido'),
  ubicacion: z.string().optional(),
  activo: z.boolean(),
});
