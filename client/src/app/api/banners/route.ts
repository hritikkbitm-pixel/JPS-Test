import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Banner from '@/models/Banner';

export async function GET() {
    try {
        await dbConnect();
        const banners = await Banner.find({});
        return NextResponse.json(banners);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const banner = await Banner.create(body);
        return NextResponse.json(banner, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
