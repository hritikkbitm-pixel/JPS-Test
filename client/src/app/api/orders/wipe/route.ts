import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';

export async function DELETE() {
    try {
        await dbConnect();
        await Order.deleteMany({});
        return NextResponse.json({ message: 'All orders wiped successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
