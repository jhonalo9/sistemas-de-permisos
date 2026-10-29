import React from 'react';
import { estadoColor, estadoLabel, errorMessage } from '@/utils/format';
import { ToastContainer, useToast, ToastProvider } from './Toast';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
  };

  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface BadgeProps {
  estado: string;
  className?: string;
}

export function Badge({ estado, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${estadoColor(estado)} ${className}`}>
      {estadoLabel(estado)}
    </span>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: any;
  helper?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, className = '', ...props },
  ref
) {
  const errorText = errorMessage(error);
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {errorText && <p className="error-text">{errorText}</p>}
      {helper && !errorText && <p className="helper-text">{helper}</p>}
    </div>
  );
});

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: any;
  helper?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, helper, className = '', ...props },
  ref
) {
  const errorText = errorMessage(error);
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={`textarea-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {errorText && <p className="error-text">{errorText}</p>}
      {helper && !errorText && <p className="helper-text">{helper}</p>}
    </div>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: any;
  helper?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, options, className = '', ...props },
  ref
) {
  const errorText = errorMessage(error);
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={`select-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        <option value="" disabled>Seleccione una opción</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorText && <p className="error-text">{errorText}</p>}
      {helper && !errorText && <p className="helper-text">{helper}</p>}
    </div>
  );
});

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  danger?: boolean;
}

export function Modal({ isOpen, onClose, title, children, confirmLabel = 'Aceptar', cancelLabel = 'Cancelar', onConfirm, danger = false }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card p-6 rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 transform scale-100">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text">{title}</h3>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => onConfirm?.()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`card ${className}`}>{children}</div>;
}

interface ConfidentialBadgeProps {
  className?: string;
}

export function ConfidentialBadge({ className = '' }: ConfidentialBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 ${className}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Información confidencial
    </div>
  );
}

interface ProgressBarProps {
  valor: number;
  maximo: number;
  className?: string;
}

export function ProgressBar({ valor, maximo, className = '' }: ProgressBarProps) {
  const porcentaje = maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0;
  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 ${className}`}>
      <div className={`bg-primary h-3 rounded-full transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
    </div>
  );
}

interface DropZoneProps {
  onFilesChange: (files: File[]) => void;
  accept?: string;
  className?: string;
}

export function DropZone({ onFilesChange, accept, className = '' }: DropZoneProps) {
  const [files, setFiles] = React.useState<File[]>([]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary hover:bg-blue-50 transition-colors ${className}`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </div>
      <p className="text-sm text-text">Arrastre archivos aquí o haga clic para seleccionar</p>
      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 10 MB)</p>

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Archivos seleccionados:</p>
          <div className="space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="truncate max-w-xs">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TimelineItemProps {
  title: string;
  subtitle?: string;
  fecha: string;
  completado: boolean;
  className?: string;
}

export function TimelineItem({ title, subtitle, fecha, completado, className = '' }: TimelineItemProps) {
  return (
    <div className={`relative pl-12 mb-6 ${className}`}>
      <div className="absolute left-0 top-1 w-2 h-2 rounded-full border-2">
        {completado ? <div className="bg-green-500 border-green-500" /> : <div className="bg-gray-200 border-gray-300" />}
      </div>
      <div className="absolute left-0 top-3 w-px h-full bg-gray-200" />
      <div className="mb-1">
        <span className={`font-semibold ${completado ? 'text-green-700' : 'text-text'}`}>{title}</span>
        {subtitle && <span className="ml-2 text-sm text-gray-500">· {subtitle}</span>}
      </div>
      <p className="text-xs text-gray-500">{fecha}</p>
    </div>
  );
}

interface BarcodeReaderInputProps {
  onScan: (codigo: string) => void;
  placeholder?: string;
  className?: string;
}

export function BarcodeReaderInput({ onScan, placeholder = 'Pase el código de la papeleta', className = '' }: BarcodeReaderInputProps) {
  const [valor, setValor] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && valor.trim()) {
      onScan(valor.trim());
      setValor('');
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 p-8 ${className}`}>
      <p className="text-lg font-semibold text-text text-center">{placeholder}</p>
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg px-6 py-6 text-2xl font-mono text-primary bg-white border-4 border-primary rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-center"
        autoComplete="off"
      />
      <p className="text-sm text-gray-500">Presione Enter después de escanear</p>
    </div>
  );
}

interface PrintPapeletaProps {
  datos: any;
  esEmergencia?: boolean;
  onPrint: () => void;
  onClose: () => void;
}

export function PrintPapeleta({ datos, esEmergencia = false, onPrint, onClose }: PrintPapeletaProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-[210mm] max-h-[296mm] overflow-y-auto mx-4">
        <div className="border-2 border-black p-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-sm font-bold text-center uppercase tracking-widest">Municipalidad Distrital de Jose Leonardo Ortiz</h1>
              <p className="text-xs font-bold text-center uppercase">Oficina de Gestión de Recursos Humanos</p>
              <p className="text-xs font-bold text-center uppercase">Papeleta de Salida y Retorno de Personal</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold">Año: {new Date().getFullYear()}</p>
              <p className="text-xs font-bold">N.º {datos.nro_solicitud || '----'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div>
              <label className="block text-gray-600 mb-1">Apellidos y nombres:</label>
              <p className="font-bold border-b border-black pb-1">{datos.servidor?.apellidos + ', ' + datos.servidor?.nombres || ''}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">DNI:</label>
              <p className="font-bold border-b border-black pb-1">{datos.servidor?.dni || ''}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Unidad orgánica:</label>
              <p className="font-bold border-b border-black pb-1">{datos.servidor?.unidad || ''}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Cargo:</label>
              <p className="font-bold border-b border-black pb-1">{datos.servidor?.cargo || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div>
              <label className="block text-gray-600 mb-1">Motivo de salida:</label>
              <p className="font-bold border-b border-black pb-1">{datos.motivo || ''}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Lugar de comisión:</label>
              <p className="font-bold border-b border-black pb-1">{datos.lugar || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-xs">
            <div>
              <label className="block text-gray-600 mb-1">Hora de salida:</label>
              <p className="font-bold border-b border-black pb-1">{datos.hora_salida || ''}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Hora de retorno:</label>
              <p className="font-bold border-b border-black pb-1">{datos.hora_retorno || ''}</p>
            </div>
          </div>

          {esEmergencia && (
            <div className="bg-red-50 border border-red-200 p-3 mb-6 rounded text-xs font-bold text-red-800 uppercase tracking-wider text-center">
              SALIDA DE EMERGENCIA - POR REGULARIZAR
            </div>
          )}

          <div className="mt-12 border-t-2 border-black pt-6">
            <div className="grid grid-cols-5 gap-8 text-xs">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Fecha</p>
                <div className="h-px w-full border-b border-black mt-4" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">Control de personal</p>
                <div className="h-px w-full border-b border-black mt-4" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">Jefe inmediato</p>
                <div className="h-px w-full border-b border-black mt-4" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">V°B° G.G.R.H.</p>
                <div className="h-px w-full border-b border-black mt-4" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">Firma entidad destino</p>
                <div className="h-px w-full border-b border-black mt-4" />
              </div>
            </div>
          </div>

          <p className="mt-6 text-[10px] text-gray-600 text-justify">
            Esta papeleta debe ser llenada por duplicado; la copia deberá ser entregada al retorno, debidamente visada por el jefe inmediato,
            bajo responsabilidad, indicando el nombre y apellido legible.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={onPrint}>Imprimir original y copia</Button>
        </div>
      </div>
    </div>
  );
}

interface TableProps {
  columns: string[];
  rows: any[];
}

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-sm text-text">
                  {row[col] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { ToastContainer, useToast, ToastProvider };
