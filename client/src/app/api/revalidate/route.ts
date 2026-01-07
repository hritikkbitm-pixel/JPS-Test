import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * On-Demand Revalidation API
 * 
 * Call this endpoint after updating products in the admin panel
 * to clear the ISR cache and show fresh data immediately.
 * 
 * Usage:
 * POST /api/revalidate
 * Body: { path: "/product/xyz123", secret: "your-secret" }
 * 
 * Or to revalidate all products:
 * POST /api/revalidate
 * Body: { path: "/", secret: "your-secret" }
 */

// Secret token to prevent unauthorized revalidation
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'jps-revalidate-2024';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, secret, productId } = body;

        // Validate secret
        if (secret !== REVALIDATE_SECRET) {
            return NextResponse.json(
                { error: 'Invalid secret token' },
                { status: 401 }
            );
        }

        // Revalidate specific product page
        if (productId) {
            revalidatePath(`/product/${productId}`);
            console.log(`✅ Revalidated: /product/${productId}`);
            return NextResponse.json({
                revalidated: true,
                path: `/product/${productId}`,
                now: Date.now()
            });
        }

        // Revalidate specific path
        if (path) {
            revalidatePath(path);
            console.log(`✅ Revalidated: ${path}`);
            return NextResponse.json({
                revalidated: true,
                path,
                now: Date.now()
            });
        }

        // Revalidate homepage (product listings)
        revalidatePath('/');
        console.log('✅ Revalidated: /');

        return NextResponse.json({
            revalidated: true,
            path: '/',
            now: Date.now()
        });

    } catch (error) {
        console.error('Revalidation error:', error);
        return NextResponse.json(
            { error: 'Failed to revalidate' },
            { status: 500 }
        );
    }
}

// Also support GET for simple testing
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get('secret');
    const path = searchParams.get('path') || '/';

    if (secret !== REVALIDATE_SECRET) {
        return NextResponse.json(
            { error: 'Invalid secret token' },
            { status: 401 }
        );
    }

    revalidatePath(path);
    console.log(`✅ Revalidated via GET: ${path}`);

    return NextResponse.json({
        revalidated: true,
        path,
        now: Date.now()
    });
}
