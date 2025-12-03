import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const { id } = params;
        const { text, sender } = await request.json();

        if (!text || !sender) {
            return NextResponse.json({ error: 'Text and sender are required' }, { status: 400 });
        }

        const order = await Order.findOne({ id });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const newMessage = {
            text,
            sender,
            date: new Date().toLocaleString()
        };

        order.messages.push(newMessage);
        await order.save();

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
