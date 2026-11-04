import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button, TextArea } from '@/components/common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  descripcion?: string;
  etiqueta: string;
  placeholder?: string;
  confirmarTexto: string;
  peligro?: boolean;
  onConfirm: (motivo: string) => Promise<void> | void;
}

export default function ModalMotivo({
  isOpen,
  onClose,
  titulo,
  descripcion,
  etiqueta,
  placeholder,
  confirmarTexto,
  peligro = false,
  onConfirm,
}: Props) {
  const [motivo, setMotivo] = React.useState('');
  const [error, setError] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    setMotivo('');
    setError('');
    setEnviando(false);

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

  const confirmar = async () => {
    const texto = motivo.trim();
    if (texto.length < 5) {
      setError('Indique un motivo de al menos 5 caracteres.');
      return;
    }

    setError('');
    setEnviando(true);
    try {
      await onConfirm(texto);
      onClose();
    } catch {
      // El componente padre ya muestra el mensaje de error.
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="motivo-titulo"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!enviando) onClose();
        }}
      />

      <div className="relative bg-card w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              peligro ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="motivo-titulo" className="font-semibold text-text">
              {titulo}
            </h2>
            {descripcion && <p className="text-sm text-gray-600 mt-1">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-text disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <TextArea
            label={etiqueta}
            rows={4}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            error={error || undefined}
            autoFocus
          />
          <div className="flex items-center justify-between -mt-2">
            <p className="helper-text">Mínimo 5 caracteres.</p>
            <p className="helper-text">{motivo.trim().length} caracteres</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant={peligro ? 'danger' : 'primary'}
            onClick={confirmar}
            disabled={enviando || motivo.trim().length < 5}
          >
            {enviando ? 'Guardando...' : confirmarTexto}
          </Button>
        </div>
      </div>
    </div>
  );
}
