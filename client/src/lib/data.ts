import legacyData from './legacy_data.json';

export interface ProductSpecs {
    socket?: string;
    cpu_socket?: string; // Added
    memory_support?: string[];
    tdp_watts?: number;
    tdp?: number; // Added
    memory_type?: string | string[];
    form_factor?: string;
    capacity?: number;
    type?: string;
    length?: number;
    length_mm?: number; // Added
    recommended_psu?: number;
    power_watts?: number;
    max_gpu_len?: number;
    max_gpu_length_mm?: number; // Added
    watts?: number;
    chipset?: string;
    pcie_gen?: string;
    wattage?: number;
    socket_support?: string[];
    base_clock?: string; // Added
    boost_clock?: string; // Added
    memory?: string; // Added (for GPU VRAM)
    height_mm?: number; // Added
    max_cpu_cooler_height_mm?: number; // Added
    m2_slots_gen4?: number; // Added
    pci_slots?: number; // Added
    sata_ports?: number; // Added
    interface?: string; // Added
    max_memory_gb?: number; // Added
    modules?: number; // Added
}

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    brand: string;
    image: string;
    images?: string[]; // Added
    specs: ProductSpecs;
    sold: number;
    available: boolean;
    unavailable?: boolean;
    featured?: boolean;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface ShippingAddress {
    label: string;
    line1: string;
    line2: string;
    city: string;
    zip: string;
    state: string;
    phone: string;
}

export interface OrderMessage {
    text: string;
    date: string;
    sender: string;
}

export interface Order {
    id: string;
    email?: string;
    date: string;
    items: Product[];
    total: number;
    status: string;
    shippingAddress: ShippingAddress;
    messages: OrderMessage[];
    invoice: string;
}

export interface Banner {
    id?: string;
    title: string;
    sub: string;
    image: string;
    target: string;
    type: string; // 'hero', 'promo', 'product-grid'
    description?: string; // For product-grid banners
    productIds?: string[]; // For product-grid banners
    backgroundColor?: string;
    textColor?: string;
    targetType?: 'category' | 'brand' | 'product' | 'custom'; // Type of redirect
    targetValue?: string; // Category name, brand name, or product ID
}

export interface Category {
    id: string;
    label: string;
    image: string;
}

export interface AppData {
    products: Product[];
    cart: CartItem[];
    orders: Order[];
    banners?: Banner[];
    categories?: Category[];
}

export const data: AppData = legacyData as unknown as AppData;

export const products = data.products;
export const orders = data.orders;
export const cart = data.cart;

export const initialCategories: Category[] = [
    { id: 'cpu', label: 'Processors', image: 'https://img.freepik.com/free-photo/cpu-processor-chip-circuit-board_23-2150834127.jpg' },
    { id: 'motherboard', label: 'Motherboards', image: 'https://img.freepik.com/free-photo/top-view-motherboard-with-neon-lights_23-2151340260.jpg' },
    { id: 'gpu', label: 'Graphics Cards', image: 'https://img.freepik.com/free-photo/computer-video-card-with-neon-lights_23-2151340265.jpg' },
    { id: 'ram', label: 'Memory', image: 'https://img.freepik.com/free-photo/ram-memory-modules-computer-mainboard_23-2150834135.jpg' },
    { id: 'storage', label: 'Storage', image: 'https://img.freepik.com/free-photo/hard-disk-drive-inside_23-2150834140.jpg' },
    { id: 'case', label: 'Cabinets', image: 'https://img.freepik.com/free-photo/modern-computer-case-with-rgb-lighting_23-2150834145.jpg' },
    { id: 'psu', label: 'Power Supply', image: 'https://img.freepik.com/free-photo/computer-power-supply-unit_23-2150834150.jpg' },
    { id: 'cooling', label: 'Cooling', image: 'https://img.freepik.com/free-photo/cpu-cooler-fan_23-2150834155.jpg' }
];

export const banners: Banner[] = [
    {
        id: '1',
        image: "https://img.freepik.com/free-photo/view-illuminated-neon-gaming-keyboard-setup-controller_23-2149529364.jpg",
        title: "NEXT GEN GAMING",
        sub: "Experience the future of gaming with our latest RTX 50 Series systems.",
        type: "hero",
        target: "/store"
    },
    {
        id: '2',
        image: "https://img.freepik.com/free-photo/still-life-with-scales-justice_23-2149775044.jpg",
        title: "BUILD YOUR DREAM",
        sub: "Custom loop liquid cooling configurations available now.",
        type: "hero",
        target: "/builder"
    }
];
