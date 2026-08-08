// apps/main-app/src/components/osint/__tests__/RiskMatrix.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RiskMatrix, RiskItem } from '../RiskMatrix';

const mockRisks: RiskItem[] = [
  {
    id: 'r1',
    title: 'Dirección Fiscal Sospechosa',
    category: 'GEOLOCATION',
    impact: 'HIGH',
    probability: 'HIGH',
    severity: 'CRITICAL',
    description: 'Oficina coincidente con edificio comercial/hotel.',
  },
  {
    id: 'r2',
    title: 'Dominio de Correo Público',
    category: 'COMMUNICATION',
    impact: 'LOW',
    probability: 'LOW',
    severity: 'LOW',
    description: 'Uso de cuentas gratuitas de correo.',
  },
];

describe('RiskMatrix Component', () => {
  it('debe renderizar la matriz 3x3 y la lista de hallazgos iniciales', () => {
    render(<RiskMatrix risks={mockRisks} />);

    expect(screen.getByText('Matriz Visual de Riesgos B2B')).toBeInTheDocument();
    expect(screen.getByText('Dirección Fiscal Sospechosa')).toBeInTheDocument();
    expect(screen.getByText('Dominio de Correo Público')).toBeInTheDocument();
  });

  it('debe filtrar los hallazgos al hacer clic en un cuadrante de la matriz', () => {
    render(<RiskMatrix risks={mockRisks} />);

    // Buscar el botón del cuadrante Alta / Alto (CRITICAL)
    const criticalButton = screen.getByText('CRITICAL').closest('button');
    if (criticalButton) {
      fireEvent.click(criticalButton);
    }

    // El riesgo de severidad CRITICAL debe verse, pero el de LOW debe estar filtrado
    expect(screen.getByText('Dirección Fiscal Sospechosa')).toBeInTheDocument();
    expect(screen.queryByText('Dominio de Correo Público')).not.toBeInTheDocument();

    // Limpiar filtro
    const clearButton = screen.getByText(/Limpiar filtro de cuadrante/i);
    fireEvent.click(clearButton);

    // Vuelven a aparecer ambos
    expect(screen.getByText('Dominio de Correo Público')).toBeInTheDocument();
  });
});