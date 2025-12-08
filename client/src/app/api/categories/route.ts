import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Category } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const categories = await Category.find({});
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
