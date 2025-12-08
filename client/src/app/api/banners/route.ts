import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Banner } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const banners = await Banner.find({});
        return NextResponse.json(banners);
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const banner = await Banner.create(body);
        return NextResponse.json(banner);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
    }
}
