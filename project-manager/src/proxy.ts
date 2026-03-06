import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route RBAC Rules ─────────────────────────────────────────────────────────
// Order matters: more specific paths must come BEFORE generic ones.
// First matching rule wins.
const ROUTE_RULES: Array<{ prefix: string; exact?: boolean; allowed: string[] }> = [
    // Trash — ADMIN only
    { prefix: '/trash', allowed: ['ADMIN'] },

    // Employees create — ADMIN only
    { prefix: '/employees/new', allowed: ['ADMIN'] },
    // Employees list — ADMIN, GLOBAL_ACCOUNTANT, GENERAL_MANAGER
    { prefix: '/employees', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Projects create — ADMIN only
    { prefix: '/projects/new', allowed: ['ADMIN'] },

    // Wallet — finance roles
    { prefix: '/wallet', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Finance Requests — finance roles
    { prefix: '/finance-requests', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Deposits — finance roles
    { prefix: '/deposits', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Reports — finance + management
    { prefix: '/reports', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Notifications send — ADMIN only
    { prefix: '/notifications/send', allowed: ['ADMIN'] },

    // Invoices + purchases — all authenticated users (filtered server-side)
    { prefix: '/invoices', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },
    { prefix: '/purchases', allowed: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },
];

// ─── Proxy ────────────────────────────────────────────────────────────────────
export function proxy(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;
    const path = request.nextUrl.pathname;

    // Allow public paths — redirect logged-in users away from /login
    if (path.startsWith('/login') || path.startsWith('/register')) {
        if (sessionCookie) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // Redirect unauthenticated users to /login
    if (!sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', path);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // Decode JWT payload without verifying signature
        // (full verification happens in server components / actions)
        const payloadToken = sessionCookie.split('.')[1];
        if (!payloadToken) throw new Error('Invalid token format');

        const decodedPayload = JSON.parse(atob(payloadToken)) as { role?: string };
        const role = decodedPayload.role || 'USER';

        // Check route rules (first match wins)
        for (const rule of ROUTE_RULES) {
            const matches = path === rule.prefix ||
                path.startsWith(rule.prefix + '/') ||
                path.startsWith(rule.prefix + '?');

            if (matches) {
                if (!rule.allowed.includes(role)) {
                    return NextResponse.redirect(new URL('/', request.url));
                }
                break; // authorized by this rule
            }
        }

        return NextResponse.next();
    } catch {
        // Invalid token — clear cookie and force re-login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

