import React from 'react';
import { descargarBlob, obtenerAdjuntoBlob } from '@/services/api';
import { useToast } from '@/components/common';
import { Download, FileText, X } from 'lucide-react';

export interface AdjuntoVista {
  id_adjunto: number | string;
  nombre_arch: string;
  mime?: string | null;
  tamano_bytes?: number | null;
  confidencial?: number | boolean;
}

interface Props {
  idSolicitud: number | string | null;
  adjunto: AdjuntoVista | null;
  onClose: () => void;
}

function esImagen(mime: string, nombre: string): boolean {
  return mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(nombre);
}

function esPdf(mime: string, nombre: string): boolean {
  return mime === 'application/pdf' || /\.pdf$/i.test(nombre);
}

function esTexto(mime: string, nombre: string): boolean {
  return mime.startsWith('text/') || /\.(txt|csv|log)$/i.test(nombre);
}

export default function VistaPreviaAdjunto({ idSolicitud, adjunto, onClose }: Props) {
  const { toast } = useToast();
  const [url, setUrl] = React.useState<string | null>(null);
  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!adjunto || idSolicitud === null || idSolicitud === undefined) {
      setUrl(null);
      setBlob(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelado = false;
    let urlCreada: string | null = null;

    setLoading(true);
    setError(null);
    setUrl(null);
    setBlob(null);

    obtenerAdjuntoBlob(idSolicitud, adjunto.id_adjunto)
      .then((archivo) => {
        if (cancelado) return;
        urlCreada = URL.createObjectURL(archivo);
        setBlob(archivo);
        setUrl(urlCreada);
      })
      .catch((e: any) => {
        if (!cancelado) setError(e?.mensaje || 'No se pudo cargar el archivo.');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [idSolicitud, adjunto]);

  React.useEffect(() => {
    if (!adjunto) return;

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', alPresionar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [adjunto, onClose]);

  if (!adjunto) return null;

  const nombre = adjunto.nombre_arch || 'Adjunto';
  const mime = (adjunto.mime || blob?.type || '').toLowerCase();
  const tamanoKb = adjunto.tamano_bytes ? Math.max(1, Math.round(adjunto.tamano_bytes / 1024)) : null;

  const descargar = () => {
    if (!blob) return;
    try {
      descargarBlob(blob, nombre);
    } catch {
      toast.error('No se pudo descargar', 'Intente nuevamente.');
    }
  };

  const abrirEnPestana = () => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card w-full max-w-5xl max-h-[94vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-text truncate">{nombre}</h3>
            <p className="text-xs text-gray-500">
              {[mime || 'Tipo desconocido', tamanoKb ? `${tamanoKb} KB` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={descargar}
              disabled={!blob}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-text"
              aria-label="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-3 sm:p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="mt-3 text-sm text-gray-600">Cargando evidencia...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FileText className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-red-600">{error}</p>
              <p className="text-xs text-gray-500 mt-1">El archivo no está disponible para previsualizar.</p>
            </div>
          )}

          {!loading && !error && url && (
            <>
              {esImagen(mime, nombre) && (
                <img
                  src={url}
                  alt={nombre}
                  className="max-h-[72vh] max-w-full mx-auto object-contain rounded-lg shadow-sm"
                />
              )}

              {(esPdf(mime, nombre) || esTexto(mime, nombre)) && (
                <iframe
                  src={url}
                  title={nombre}
                  className="w-full h-[72vh] rounded-lg border border-gray-200 bg-white"
                />
              )}

              {!esImagen(mime, nombre) && !esPdf(mime, nombre) && !esTexto(mime, nombre) && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-text">Este formato no se puede previsualizar.</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">Descargue el archivo para revisarlo.</p>
                  <button type="button" onClick={descargar} className="btn-primary">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar archivo
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && !error && (esPdf(mime, nombre) || esTexto(mime, nombre)) && (
          <div className="px-5 py-2 border-t border-gray-200 text-right">
            <button type="button" onClick={abrirEnPestana} className="text-xs text-primary hover:underline">
              Abrir en una pestaña nueva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
