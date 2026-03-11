import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        geminiFromProcessEnv: process.env.GEMINI_API_KEY ? 'EXISTS' : 'MISSING',
        geminiLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
        nodeEnv: process.env.NODE_ENV,
        hasEnvFile: process.env.DATABASE_URL ? 'YES' : 'NO'
    });
}
