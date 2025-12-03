import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
    id: string;
    title: string;
    sub: string;
    image: string;
    target: string;
    type: string;
    targetType: string;
    targetValue: string;
    productIds: string[];
    description: string;
    backgroundColor: string;
    textColor: string;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String },
    sub: { type: String },
    image: { type: String, required: true },
    target: { type: String },
    type: { type: String, default: 'hero' },
    targetType: { type: String },
    targetValue: { type: String },
    productIds: [{ type: String }],
    description: { type: String },
    backgroundColor: { type: String },
    textColor: { type: String }
}, { timestamps: true });

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
