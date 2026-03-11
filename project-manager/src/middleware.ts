import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route RBAC Rules ─────────────────────────────────────────────────────────
// Order matters: more specific paths must come BEFORE generic ones.
// First matching rule wins.
const ROUTE_RULES: Array<{ prefix: string; exact?: boolean; allowed: string[] }> = [
    // Settings categories — ROOT + ADMIN + GLOBAL_ACCOUNTANT
    { prefix: '/settings/categories', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT'] },
    // Settings (profile page) — all authenticated roles
    { prefix: '/settings', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER', 'USER'] },

    // Trash — ROOT + ADMIN only
    { prefix: '/trash', allowed: ['ROOT', 'ADMIN'] },

    // Employees create — ROOT + ADMIN only
    { prefix: '/employees/new', allowed: ['ROOT', 'ADMIN'] },
    // Employees list
    { prefix: '/employees', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Projects create — ROOT + ADMIN only
    { prefix: '/projects/new', allowed: ['ROOT', 'ADMIN'] },

    // Wallet — finance roles
    { prefix: '/wallet', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Finance Requests
    { prefix: '/finance-requests', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Deposits
    { prefix: '/deposits', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Reports
    { prefix: '/reports', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Archives
    { prefix: '/archives', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Debts
    { prefix: '/debts', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER', 'USER'] },

    // Custody
    { prefix: '/custody', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // External custodies report
    { prefix: '/external-custodies', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Employee custodies report
    { prefix: '/employee-custodies', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Company custodies
    { prefix: '/company-custodies', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },

    // Notifications send
    { prefix: '/notifications/send', allowed: ['ROOT', 'ADMIN', 'GENERAL_MANAGER'] },

    // Invoices + purchases — all authenticated users
    { prefix: '/invoices', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },

    // Purchases create
    { prefix: '/purchases/new', allowed: ['ROOT', 'ADMIN', 'GENERAL_MANAGER', 'USER'] },
    // Purchases list
    { prefix: '/purchases', allowed: ['ROOT', 'ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },

    // v8: Branch management — ROOT only
    { prefix: '/branches', allowed: ['ROOT'] },
];

// ─── Middleware ─────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;
    const path = request.nextUrl.pathname;

    // Allow public paths — redirect logged-in users away from /login and /welcome
    if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/welcome')) {
        if (sessionCookie) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // Explicitly allow public verification routes regardless of session
    if (path.startsWith('/verify')) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users to /welcome
    if (!sessionCookie) {
        const welcomeUrl = new URL('/welcome', request.url);
        return NextResponse.redirect(welcomeUrl);
    }

    try {
        // Decode JWT payload without verifying signature
        // (full verification happens in server components / actions)
        const payloadToken = sessionCookie.split('.')[1];
        if (!payloadToken) throw new Error('Invalid token format');

        // Robust base64 decoding for UTF-8 (supports Arabic text and emojis like 🇶🇦)
        const base64Str = payloadToken.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64Str)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const decodedPayload = JSON.parse(jsonPayload) as { role?: string };
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
        const response = NextResponse.redirect(new URL('/welcome', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icon-.*\\.png|spacetoon-logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

