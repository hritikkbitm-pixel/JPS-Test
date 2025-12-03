import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    picture?: string;
    role: 'user' | 'admin';
    provider: 'google' | 'credentials';
    addresses: {
        label?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        zip?: string;
        phone?: string;
    }[];
    orders: mongoose.Types.ObjectId[];
    createdAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        // Password is not required for Google users
        select: false, // Don't return password by default
    },
    picture: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    provider: {
        type: String,
        enum: ['google', 'credentials'],
        required: true,
    },
    addresses: [{
        label: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        zip: String,
        phone: String,
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt
// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
