import React from 'react';
import { FileText, X } from 'lucide-react';
import NuevaSolicitud from '@/pages/servidor/NuevaSolicitud';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalNuevaSolicitud({ isOpen, onClose }: Props) {
  React.useEffect(() => {
    if (!isOpen) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nueva-solicitud-titulo"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card w-full max-w-3xl max-h-[94vh] rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="nueva-solicitud-titulo" className="font-semibold text-text">
              Nueva solicitud
            </h2>
            <p className="text-sm text-gray-600">
              Elija cómo se medirá su solicitud y complete los datos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-text"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <NuevaSolicitud embedded onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
