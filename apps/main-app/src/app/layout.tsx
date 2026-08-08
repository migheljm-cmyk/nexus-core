// apps/main-app/src/app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Nexus Core - OSINT Engine',
  description: 'Cyber-Forensics & Due Diligence B2B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0D1117] text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}