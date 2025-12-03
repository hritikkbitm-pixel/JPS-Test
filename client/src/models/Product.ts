import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    brand: string;
    image: string;
    images: string[];
    specs: Map<string, any>;
    sold: number;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String },
    images: [{ type: String }],
    specs: { type: Map, of: Schema.Types.Mixed },
    sold: { type: Number, default: 0 },
    available: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
