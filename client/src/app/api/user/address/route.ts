import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ addresses: user.addresses || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { address } = await req.json();

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Add new address to the beginning of the array
        user.addresses.unshift(address);

        // Limit to 5 addresses
        if (user.addresses.length > 5) {
            user.addresses = user.addresses.slice(0, 5);
        }

        await user.save();

        return NextResponse.json({ message: 'Address saved', addresses: user.addresses });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { index } = await req.json();

        if (index === undefined || index === null) {
            return NextResponse.json({ error: 'Index is required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove address at specific index
        if (user.addresses && user.addresses[index]) {
            user.addresses.splice(index, 1);
            await user.save();
        }

        return NextResponse.json({ message: 'Address removed', addresses: user.addresses });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
