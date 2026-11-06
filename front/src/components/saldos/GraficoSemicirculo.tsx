import React from 'react';
import { Card } from '@/components/common';
import { unidadLabel } from '@/utils/format';

interface Props {
  saldo: any;
}

function numero(valor: number): string {
  return Number(valor.toFixed(2)).toString();
}

export default function GraficoSemicirculo({ saldo }: Props) {
  const total = Number(saldo.asignado) || 0;
  const usado = Number(saldo.usado) || 0;
  const disponible = total - usado;
  const porcentaje = total > 0 ? Math.min(100, Math.max(0, (usado / total) * 100)) : 0;
  const unidad = unidadLabel(saldo.tipo?.unidad_medida || 'DIAS');

  const color = total <= 0
    ? '#94A3B8'
    : porcentaje >= 100
      ? '#DC2626'
      : porcentaje >= 80
        ? '#F59E0B'
        : '#16A34A';

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-text text-center mb-3">
        {saldo.tipo?.nombre || 'Saldo'}
      </p>

      <svg
        viewBox="0 0 200 118"
        className="w-full max-w-[220px] mx-auto"
        role="img"
        aria-label={`${Math.round(porcentaje)}% usado de ${numero(total)} ${unidad}`}
      >
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${porcentaje} ${100 - porcentaje}`}
          className="transition-all duration-500"
        />
        <text
          x="100"
          y="82"
          textAnchor="middle"
          fill="#0F172A"
          style={{ fontSize: 26, fontWeight: 700 }}
        >
          {Math.round(porcentaje)}%
        </text>
        <text
          x="100"
          y="101"
          textAnchor="middle"
          fill="#64748B"
          style={{ fontSize: 10, fontWeight: 600 }}
        >
          usado
        </text>
      </svg>

      <div className="mt-2 text-center">
        {total > 0 ? (
          <>
            <p className="text-xs text-text-muted">
              Usado: {numero(usado)} de {numero(total)} {unidad}
            </p>
            <p className="text-sm font-semibold text-text mt-1">
              Disponible: {numero(disponible)} {unidad}
            </p>
            {disponible < 0 && (
              <p className="text-xs font-semibold text-red-600 mt-1">
                Saldo excedido
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-text-muted">Sin saldo asignado</p>
        )}
      </div>
    </Card>
  );
}
