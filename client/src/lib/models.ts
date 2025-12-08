import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    category: String,
    image: String,
    description: String,
    specs: mongoose.Schema.Types.Mixed,
    featured: Boolean,
    popular: Boolean,
    brand: String,
    stock: Number
}, { strict: false, timestamps: true });

const CategorySchema = new mongoose.Schema({
    id: String,
    name: String,
    image: String,
    icon: String,
    itemCount: Number
}, { strict: false });

const BannerSchema = new mongoose.Schema({
    id: String,
    image: String,
    title: String,
    sub: String,
    type: String, // 'hero', 'promo', 'product-grid'
    target: String,
    productIds: [String],
    backgroundColor: String,
    textColor: String,
    description: String
}, { strict: false });

const OrderSchema = new mongoose.Schema({
    id: String,
    items: Array,
    total: Number,
    status: String,
    date: String,
    shippingAddress: Object,
    paymentMethod: String,
    paymentStatus: String,
    txnId: String,
    userEmail: String,
    messages: Array
}, { strict: false, timestamps: true });

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
