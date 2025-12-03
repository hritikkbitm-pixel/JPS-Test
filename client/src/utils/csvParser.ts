import { Product } from '../lib/data';

// Define the Flat CSV Row Interface
// Define the Flat CSV Row Interface
interface CSVFlatRow {
    id: string;
    name: string;
    category: string;
    brand: string;
    price: string;
    stock: string;
    sold: string;
    available: string;
    // Images
    image_1?: string;
    image_2?: string;
    image_3?: string;
    image_4?: string;
    image_5?: string;
    image_6?: string;
    // Flattened Specs
    socket?: string;
    form_factor?: string;
    tdp_watts?: string;
    memory_type?: string;
    clock_speed?: string;
    chipset?: string;
    vram_gb?: string;
    length_mm?: string;
    height_mm?: string;
    slots?: string;
    interface?: string;
    capacity_gb?: string;
    modules_count?: string;
}

export const generateCSV = (products: Product[]): string => {
    const headers = [
        'id', 'name', 'category', 'brand', 'price', 'stock', 'sold', 'available',
        'image_1', 'image_2', 'image_3', 'image_4', 'image_5', 'image_6',
        'socket', 'form_factor', 'tdp_watts', 'memory_type', 'clock_speed',
        'chipset', 'vram_gb', 'length_mm', 'height_mm', 'slots',
        'interface', 'capacity_gb', 'modules_count'
    ];

    const rows = products.map(p => {
        const specs = p.specs || {};
        const images = p.images || [];

        // Map specs to flat columns
        const flatRow: any = {
            id: p.id,
            name: p.name,
            category: p.category,
            brand: p.brand,
            price: p.price,
            stock: p.stock,
            sold: p.sold || 0,
            available: p.available,

            // Images
            image_1: p.image || images[0] || '',
            image_2: images[1] || '',
            image_3: images[2] || '',
            image_4: images[3] || '',
            image_5: images[4] || '',
            image_6: images[5] || '',

            // Specs Mapping
            socket: specs.socket || specs.cpu_socket || '',
            form_factor: specs.form_factor || '',
            tdp_watts: specs.tdp || '',
            memory_type: specs.memory_type || '',
            clock_speed: specs.base_clock || specs.boost_clock || '', // Simplification
            chipset: specs.chipset || '',
            vram_gb: specs.memory || '', // GPU memory
            length_mm: specs.length_mm || specs.max_gpu_length_mm || '',
            height_mm: specs.height_mm || specs.max_cpu_cooler_height_mm || '',
            slots: specs.m2_slots_gen4 || specs.pci_slots || specs.sata_ports || '',
            interface: specs.interface || '',
            capacity_gb: specs.capacity || specs.max_memory_gb || '',
            modules_count: specs.modules || ''
        };

        return headers.map(h => {
            const val = flatRow[h];
            const stringVal = val === undefined || val === null ? '' : String(val);
            return `"${stringVal.replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

export const parseCSV = (csvText: string): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return resolve([]);

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        try {
            const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) return resolve([]);

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const products: Product[] = [];

            for (let i = 1; i < lines.length; i++) {
                // Split by comma, ignoring commas inside quotes
                const rowValues = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const cleanValues = rowValues.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

                if (cleanValues.length === 0 || (cleanValues.length === 1 && cleanValues[0] === '')) continue;

                const rawRow: any = {};
                headers.forEach((h, idx) => {
                    rawRow[h] = cleanValues[idx] || '';
                });

                const row = rawRow as CSVFlatRow;

                // EXPLICIT MAPPING LOGIC
                const specs: any = {};
                const category = row.category?.toLowerCase();

                // 1. Map CPU/GPU Power
                if (row.tdp_watts) specs.tdp = parseInt(row.tdp_watts);

                // 2. Map Dimensions
                if (row.length_mm) specs.length_mm = parseInt(row.length_mm);
                if (row.height_mm) specs.height_mm = parseInt(row.height_mm);

                // 3. Map Sockets & Forms
                if (row.socket) specs.socket = row.socket;
                if (row.form_factor) specs.form_factor = row.form_factor;

                // 4. Map Memory (Critical for RAM/Mobo)
                if (row.memory_type) specs.memory_type = row.memory_type;
                if (row.capacity_gb) specs.capacity_gb = parseInt(row.capacity_gb);

                // 5. Map Storage
                if (row.interface) specs.interface = row.interface;

                // 6. Map Arrays (Split by Pipe '|')
                if (row.socket && (category === 'cooler' || category === 'case')) {
                    specs.supported_sockets = row.socket.split('|');
                }
                if (row.form_factor && category === 'case') {
                    specs.supported_motherboards = row.form_factor.split('|');
                }

                // Additional mappings for specific categories to match existing data structure
                if (category === 'motherboard') {
                    if (row.socket) specs.cpu_socket = row.socket;
                    if (row.slots) specs.m2_slots_gen4 = parseInt(row.slots);
                    // Default sata ports if not in CSV, or map if added later
                    specs.sata_ports = 6;
                }
                if (category === 'gpu') {
                    if (row.vram_gb) specs.memory = row.vram_gb; // "24GB"
                }
                if (category === 'cpu') {
                    if (row.clock_speed) specs.base_clock = row.clock_speed;
                }

                const images = [
                    row.image_1, row.image_2, row.image_3, row.image_4, row.image_5, row.image_6
                ].filter((img): img is string => !!img && img.trim() !== '');

                const product: Product = {
                    id: row.id,
                    name: row.name,
                    category: row.category,
                    brand: row.brand,
                    price: parseInt(row.price) || 0,
                    stock: parseInt(row.stock) || 0,
                    sold: parseInt(row.sold) || 0,
                    available: row.available === 'True' || row.available === 'true',
                    image: images[0] || '',
                    images: images,
                    specs: specs,
                };

                products.push(product);
            }

            resolve(products);
        } catch (error) {
            console.error("Error parsing CSV:", error);
            resolve([]);
        }
    });
};
