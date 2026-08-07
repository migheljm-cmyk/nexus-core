import React from 'react';
import { ThemeProvider } from '@nexus/ui';
import { appConfig } from '../app.config';
import './globals.css';

export const metadata = {
  title: appConfig.name,
  description: 'Micro-frontend genérico basado en NEXUS CORE Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={appConfig.theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}