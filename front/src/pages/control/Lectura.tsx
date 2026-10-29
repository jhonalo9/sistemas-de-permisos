import React from 'react';
import { apiClient } from '@/services/api';
import { Button, Card, useToast } from '@/components/common';
import { BarcodeReaderInput } from '@/components/common';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Lectura() {
  const { toast } = useToast();
  const [resultado, setResultado] = React.useState<any>(null);
  const [tipoResultado, setTipoResultado] = React.useState<'exito' | 'error' | null>(null);

  const handleScan = async (codigo: string) => {
    try {
      const res = await apiClient<any>('/marcaciones/registrar', {
        method: 'POST',
        body: { codigo },
      });
      setResultado(res.data || null);
      setTipoResultado('exito');
      toast.success('Marcación registrada', res.data?.mensaje || 'Código leído correctamente.');
    } catch (e: any) {
      setResultado({ mensaje: e.mensaje || 'Código no válido' });
      setTipoResultado('error');
      toast.error('Error en marcación', e.mensaje);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Lector de papeletas</h1>
        <p className="text-gray-600">Pase el código de barras de la papeleta en el campo de abajo.</p>
      </div>

      <BarcodeReaderInput onScan={handleScan} />

      {resultado && (
        <Card className={`p-6 border-l-4 ${tipoResultado === 'exito' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tipoResultado === 'exito' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {tipoResultado === 'exito' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${tipoResultado === 'exito' ? 'text-green-800' : 'text-red-800'}`}>
                {tipoResultado === 'exito' ? 'Éxito' : 'Error'}
              </h2>
              <div className="mt-3 space-y-2 text-sm">

                {resultado.accion_registrada && (
                  <p><strong>Acción:</strong> {resultado.accion_registrada}</p>
                )}
                {resultado.servidor && (
                  <>
                    <p><strong>Servidor:</strong> {resultado.servidor.apellidos + ', ' + resultado.servidor.nombres}</p>
                    <p><strong>DNI:</strong> {resultado.servidor.dni}</p>
                    <p><strong>Unidad:</strong> {resultado.servidor.unidad}</p>
                  </>
                )}
                
                {resultado.tipo && (
                  <p><strong>Tipo:</strong> {resultado.tipo}</p>
                )}
                {resultado.fecha_hora && (
                  <p><strong>Hora:</strong> {resultado.fecha_hora}</p>
                )}
                {resultado.tiempo_empleado_min != null && (
                  <p><strong>Tiempo empleado:</strong> {resultado.tiempo_empleado_min} minutos</p>
                )}
                {!resultado.exito && resultado.mensaje && (
                  <p className="text-red-600 font-medium"><strong>Motivo:</strong> {resultado.mensaje}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
