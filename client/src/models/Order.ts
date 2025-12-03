import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    id: string;
    email: string;
    date: string;
    items: any[];
    total: number;
    status: string;
    shippingAddress: {
        label: string;
        line1: string;
        line2: string;
        city: string;
        zip: string;
        state: string;
        phone: string;
    };
    messages: {
        text: string;
        date: string;
        sender: string;
    }[];
    invoice: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String },
    date: { type: String },
    items: [{
        id: String,
        name: String,
        category: String,
        price: Number,
        brand: String,
        image: String,
        specs: Schema.Types.Mixed,
        stock: Number,
        sold: Number,
        available: Boolean,
        unavailable: Boolean
    }],
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    shippingAddress: {
        label: String,
        line1: String,
        line2: String,
        city: String,
        zip: String,
        state: String,
        phone: String
    },
    messages: [{
        text: String,
        date: String,
        sender: String
    }],
    invoice: { type: String }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
