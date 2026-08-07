import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas protegidas que requieren roles especiales
const PROTECTED_ROUTES = ['/dashboard', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica si la ruta solicitada coincide con alguna protegida
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Leemos la galleta/token de sesión si existe
    const authSession = request.cookies.get('nexus_session')?.value;

    if (!authSession) {
      // Si no hay sesión activa, redirige al home con query de advertencia
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('unauthorized', 'true');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*'],
};