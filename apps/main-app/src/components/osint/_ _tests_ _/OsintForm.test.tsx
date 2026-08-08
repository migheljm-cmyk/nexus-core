// apps/main-app/src/components/osint/__tests__/OsintForm.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OsintForm } from '../OsintForm';

// Mock del hook useOsintAnalysis
const mockAnalyze = jest.fn();
jest.mock('../../../hooks/useOsintAnalysis', () => ({
  useOsintAnalysis: () => ({
    analyze: mockAnalyze,
    isLoading: false,
    error: null,
  }),
}));

describe('OsintForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar todos los campos de entrada y el botón de submit', () => {
    render(<OsintForm />);

    expect(screen.getByPlaceholderText(/Ej. Acme Corp LLC/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej. ABC123456789/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej. acmecorp.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej. contact@acmecorp.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Análisis OSINT/i })).toBeInTheDocument();
  });

  it('debe mantener el botón deshabilitado si todos los campos están vacíos', () => {
    render(<OsintForm />);
    const submitButton = screen.getByRole('button', { name: /Iniciar Análisis OSINT/i });
    expect(submitButton).toBeDisabled();
  });

  it('debe disparar la función analyze con la consulta adecuada al enviar el formulario', async () => {
    render(<OsintForm />);

    const companyInput = screen.getByPlaceholderText(/Ej. Acme Corp LLC/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Análisis OSINT/i });

    // Escribir empresa
    fireEvent.change(companyInput, { target: { value: 'Hunan Fansen' } });
    expect(submitButton).not.toBeDisabled();

    // Enviar formulario
    fireEvent.click(submitButton);

    expect(mockAnalyze).toHaveBeenCalledTimes(1);
    expect(mockAnalyze).toHaveBeenCalledWith('Hunan Fansen');
  });
});