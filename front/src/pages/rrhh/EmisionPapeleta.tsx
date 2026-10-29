import React from 'react';
import { useParams } from 'react-router-dom';
import { apiClient, abrirPapeletaPdf } from '@/services/api';
import { Button, Badge, Card, useToast } from '@/components/common';
import { formatearFecha } from '@/utils/format';

export default function EmisionPapeleta() {
  const { id } = useParams();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) cargarDetalle(Number(id));
  }, [id]);

  async function cargarDetalle(idSolicitud: number) {
    try {
      const res = await apiClient<any>(`/rrhh/${idSolicitud}`);
      setSolicitud(res.data || null);
    } catch (e: any) {
      toast.error('Error al cargar detalle', e.mensaje);
    } finally {
      setLoading(false);
    }
  }

  async function generarToken() {
    try {
      const res = await apiClient<any>(`/rrhh/${id}/token`, {
        method: 'POST',
      });
      toast.success('Token generado', `Código: ${res.data?.token_codigo}`);
      setSolicitud((prev: any) => ({ ...prev, token_codigo: res.data?.token_codigo }));
    } catch (e: any) {
      toast.error('Error al generar token', e.mensaje);
    }
  }

  async function vistaPrevia() {
    try {
      await abrirPapeletaPdf(id as string);
    } catch (e: any) {
      toast.error('No se pudo abrir la papeleta', e?.mensaje || 'Error');
    }
  }

  if (!solicitud) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const esPermisoHoras = solicitud.tipo?.unidad_medida === 'HORAS';
  const puedeImprimir = solicitud.estado === 'APROBADA_RRHH' && !!solicitud.token_codigo;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Emisión de papeleta</h1>
          <p className="text-gray-600">N.º {solicitud.nro_solicitud}</p>
        </div>
        <Badge estado={solicitud.estado} className="px-4 py-2 text-base" />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-4">Datos de la papeleta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase">Servidor</p>
            <p className="font-medium text-text">{solicitud.servidor?.apellidos + ', ' + solicitud.servidor?.nombres || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">DNI</p>
            <p className="font-medium text-text">{solicitud.servidor?.dni || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Unidad</p>
            <p className="font-medium text-text">{solicitud.servidor?.unidad || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Cargo</p>
            <p className="font-medium text-text">{solicitud.servidor?.cargo || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Tipo</p>
            <p className="font-medium text-text">{solicitud.tipo?.nombre || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Fechas</p>
            <p className="font-medium text-text">{formatearFecha(solicitud.fecha_inicio)} - {formatearFecha(solicitud.fecha_fin)}</p>
          </div>
          {solicitud.hora_inicio && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Hora salida</p>
              <p className="font-medium text-text">{solicitud.hora_inicio}</p>
            </div>
          )}
          {solicitud.hora_fin && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Hora retorno</p>
              <p className="font-medium text-text">{solicitud.hora_fin}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase">Código de barras</p>
            <p className="font-mono text-sm font-bold text-text">{solicitud.token_codigo || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">N.º resolución</p>
            <p className="font-medium text-text">{solicitud.nro_resolucion || '—'}</p>
          </div>
        </div>
      </Card>

      {!esPermisoHoras && (
        <Card className="bg-amber-50 border border-amber-200 rounded p-4">
          <p className="text-sm text-amber-700">
            La impresión de papeleta está disponible solo para permisos por horas. Esta solicitud es de tipo
            <strong>{solicitud.tipo?.categoria === 'LICENCIA' ? 'licencia' : 'permiso'}</strong> por días.
          </p>
        </Card>
      )}

      {!puedeImprimir && esPermisoHoras && (
        <Card className="border-dashed border-gray-300 rounded p-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Para imprimir la papeleta se debe generar el código de barras primero.
          </p>
          <Button variant="primary" onClick={generarToken} className="w-full md:w-auto">
            Generar código de barras
          </Button>
        </Card>
      )}

      {puedeImprimir && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={vistaPrevia} className="w-full md:w-auto">
            Vista previa e imprimir
          </Button>
          <Button variant="primary" onClick={generarToken} className="w-full md:w-auto">
            Regenerar código de barras
          </Button>
        </div>
      )}
    </div>
  );
}
