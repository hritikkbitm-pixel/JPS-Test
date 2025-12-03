import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    id: string;
    label: string;
    image: string;
}

const CategorySchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    image: { type: String, required: true }
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
