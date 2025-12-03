import { Part } from './types';

export const mockParts: Part[] = [
    // --- CPUs ---
    {
        id: 'cpu-intel-13900k',
        name: 'Intel Core i9-13900K',
        price: 589,
        image: 'https://m.media-amazon.com/images/I/61S7A+M+5zL._AC_SL1500_.jpg',
        brand: 'Intel',
        category: 'cpu',
        socket: 'LGA1700',
        tdp: 125,
        integrated_graphics: true
    },
    {
        id: 'cpu-amd-7800x3d',
        name: 'AMD Ryzen 7 7800X3D',
        price: 449,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'AMD',
        category: 'cpu',
        socket: 'AM5',
        tdp: 120,
        integrated_graphics: true
    },

    // --- Motherboards ---
    {
        id: 'mobo-z790-atx',
        name: 'ASUS ROG Maximus Z790 Hero',
        price: 629,
        image: 'https://m.media-amazon.com/images/I/81I-G5F-cZL._AC_SL1500_.jpg',
        brand: 'ASUS',
        category: 'motherboard',
        cpu_socket: 'LGA1700',
        form_factor: 'ATX',
        memory_type: 'DDR5',
        m2_slots_gen4: 3,
        sata_ports: 6,
        max_memory_gb: 128
    },
    {
        id: 'mobo-b650-itx',
        name: 'MSI MPG B650I EDGE WIFI',
        price: 239,
        image: 'https://m.media-amazon.com/images/I/71dcg+Y+G+L._AC_SL1500_.jpg',
        brand: 'MSI',
        category: 'motherboard',
        cpu_socket: 'AM5',
        form_factor: 'Mini-ITX',
        memory_type: 'DDR5',
        m2_slots_gen4: 2,
        sata_ports: 4,
        max_memory_gb: 64
    },

    // --- RAM ---
    {
        id: 'ram-ddr5-6000',
        name: 'G.Skill Trident Z5 RGB 32GB',
        price: 119,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'G.Skill',
        category: 'ram',
        memory_type: 'DDR5',
        speed_mhz: 6000,
        modules: 2,
        capacity_gb: 32
    },
    {
        id: 'ram-ddr4-3600',
        name: 'Corsair Vengeance RGB Pro 16GB',
        price: 69,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Corsair',
        category: 'ram',
        memory_type: 'DDR4',
        speed_mhz: 3600,
        modules: 2,
        capacity_gb: 16
    },

    // --- GPUs ---
    {
        id: 'gpu-rtx-4090',
        name: 'NVIDIA GeForce RTX 4090 FE',
        price: 1599,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'NVIDIA',
        category: 'gpu',
        length_mm: 304,
        tdp: 450,
        slot_width: 3
    },
    {
        id: 'gpu-rtx-4090-strix',
        name: 'ASUS ROG Strix RTX 4090 OC',
        price: 1999,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'ASUS',
        category: 'gpu',
        length_mm: 357.6, // Very long card
        tdp: 450,
        slot_width: 3.5
    },

    // --- Cases ---
    {
        id: 'case-atx-mid',
        name: 'Corsair 4000D Airflow',
        price: 94,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Corsair',
        category: 'case',
        supported_motherboards: ['ATX', 'Micro-ATX', 'Mini-ITX'],
        max_gpu_length_mm: 360,
        max_cpu_cooler_height_mm: 170,
        supported_radiators: ['240', '280', '360']
    },
    {
        id: 'case-itx-small',
        name: 'Cooler Master NR200P',
        price: 89,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Cooler Master',
        category: 'case',
        supported_motherboards: ['Mini-ITX', 'Mini-DTX'],
        max_gpu_length_mm: 330,
        max_cpu_cooler_height_mm: 155,
        supported_radiators: ['240', '280']
    },

    // --- Coolers ---
    {
        id: 'cooler-aio-360',
        name: 'NZXT Kraken Elite 360',
        price: 279,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'NZXT',
        category: 'cooler',
        type: 'Liquid',
        height_mm: 52, // Pump height
        radiator_size_mm: 360,
        supported_sockets: ['LGA1700', 'AM5', 'AM4']
    },
    {
        id: 'cooler-air-big',
        name: 'Noctua NH-D15',
        price: 109,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Noctua',
        category: 'cooler',
        type: 'Air',
        height_mm: 165,
        radiator_size_mm: 0,
        supported_sockets: ['LGA1700', 'AM5', 'AM4']
    },

    // --- Storage ---
    {
        id: 'storage-nvme-2tb',
        name: 'Samsung 990 Pro 2TB',
        price: 169,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Samsung',
        category: 'storage',
        type: 'NVMe',
        generation: 'Gen4',
        form_factor: 'M.2'
    },

    // --- PSU ---
    {
        id: 'psu-1000w',
        name: 'Corsair RM1000x',
        price: 189,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Corsair',
        category: 'psu',
        wattage: 1000,
        form_factor: 'ATX'
    },
    {
        id: 'psu-750w',
        name: 'Corsair SF750',
        price: 169,
        image: 'https://m.media-amazon.com/images/I/51f2hk81wGL._AC_SL1000_.jpg',
        brand: 'Corsair',
        category: 'psu',
        wattage: 750,
        form_factor: 'SFX'
    }
];
