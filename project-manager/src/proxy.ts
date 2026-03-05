import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;
    const path = request.nextUrl.pathname;

    // Public paths
    if (path.startsWith('/login') || path.startsWith('/register')) {
        if (sessionCookie) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Decode JWT payload without verifying signature (verification happens in layout/server components)
        // JWT structure: header.payload.signature
        const payloadToken = sessionCookie.split('.')[1];
        if (!payloadToken) throw new Error("Invalid token format");

        // Base-64 decode the payload
        // Use standard atob since it's available in Edge runtime
        const decodedPayload = JSON.parse(atob(payloadToken)) as { role?: string };
        const role = decodedPayload.role || 'USER';

        // Strict Role-based route protection aligned with test suite:
        if (path.startsWith('/employees') && !['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'].includes(role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Allow Accountant read-only access to projects to view budgets (Actions are secured via roles)
        // Employees and Coordinators have row-level security in actions

        if (path.startsWith('/invoices') && !['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'].includes(role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (path.startsWith('/purchases') && !['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'].includes(role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (path.startsWith('/deposits') && !['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'].includes(role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch (e) {
        // If token fails to parse, clear it and force login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
