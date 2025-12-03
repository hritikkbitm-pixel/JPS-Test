export interface BasePart {
    id: string;
    name: string;
    price: number;
    image: string;
    brand: string;
    category: 'cpu' | 'motherboard' | 'ram' | 'gpu' | 'case' | 'cooler' | 'storage' | 'psu';
}

export interface CPU extends BasePart {
    category: 'cpu';
    socket: string;
    tdp: number;
    integrated_graphics: boolean;
}

export interface Motherboard extends BasePart {
    category: 'motherboard';
    cpu_socket: string;
    form_factor: string; // e.g., "ATX", "Micro-ATX", "Mini-ITX"
    memory_type: 'DDR4' | 'DDR5';
    m2_slots_gen4: number;
    sata_ports: number;
    max_memory_gb: number;
}

export interface RAM extends BasePart {
    category: 'ram';
    memory_type: 'DDR4' | 'DDR5';
    speed_mhz: number;
    modules: number; // e.g., 2 for 2x8GB
    capacity_gb: number; // Total capacity
}

export interface GPU extends BasePart {
    category: 'gpu';
    length_mm: number;
    tdp: number;
    slot_width: number;
}

export interface Case extends BasePart {
    category: 'case';
    supported_motherboards: string[]; // e.g., ["ATX", "Micro-ATX"]
    max_gpu_length_mm: number;
    max_cpu_cooler_height_mm: number;
    supported_radiators: string[]; // e.g., ["240", "360"]
}

export interface Cooler extends BasePart {
    category: 'cooler';
    type: 'Air' | 'Liquid';
    height_mm: number;
    radiator_size_mm: number; // 0 for Air
    supported_sockets: string[];
}

export interface Storage extends BasePart {
    category: 'storage';
    type: 'NVMe' | 'SATA';
    generation: string; // e.g., "Gen4"
    form_factor: 'M.2' | '2.5';
}

export interface PSU extends BasePart {
    category: 'psu';
    wattage: number;
    form_factor: string;
}

export type Part = CPU | Motherboard | RAM | GPU | Case | Cooler | Storage | PSU;
