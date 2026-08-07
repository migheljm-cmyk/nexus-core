import type { Metadata } from 'next';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import AuthModals from '../components/auth/AuthModals';
import Navbar from '../components/navigation/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindForge',
  description: 'Ecosistema de Juegos de Estrategia Mental.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        <AuthProvider>
          {/* Barra superior visible en toda la app */}
          <Navbar />
          
          {/* Contenido de la página actual */}
          <main className="flex-1">{children}</main>
          
          {/* Modales flotantes de Login y Registro */}
          <AuthModals />
        </AuthProvider>
      </body>
    </html>
  );
}