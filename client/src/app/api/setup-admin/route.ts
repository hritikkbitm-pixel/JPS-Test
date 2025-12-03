import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await dbConnect();

        const adminEmail = 'pawan@jps.com';
        const adminPassword = 'JPS_Secure_Password_2025!@#'; // Complex password
        const adminName = 'Pawan';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            // Update existing admin
            existingAdmin.name = adminName;
            existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
            existingAdmin.role = 'admin';
            existingAdmin.provider = 'credentials';
            await existingAdmin.save();

            return NextResponse.json({
                message: 'Admin updated successfully',
                email: adminEmail,
                password: adminPassword
            });
        }

        // Create new admin
        const newAdmin = await User.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            provider: 'credentials',
        });

        return NextResponse.json({
            message: 'Admin created successfully',
            email: newAdmin.email,
            password: adminPassword
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
