const fs = require('fs');
const axios = require('axios');
const path = require('path');

const csvPath = path.join(__dirname, '../../jps-inventory.csv');

const parseCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        // Split by comma, ignoring commas inside quotes
        const rowValues = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanValues = rowValues.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

        if (cleanValues.length === 0 || (cleanValues.length === 1 && cleanValues[0] === '')) continue;

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cleanValues[idx] || '';
        });

        // EXPLICIT MAPPING LOGIC
        const specs = {};
        const category = row.category ? row.category.toLowerCase() : '';

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

        // Additional mappings for specific categories
        if (category === 'motherboard') {
            if (row.socket) specs.cpu_socket = row.socket;
            if (row.slots) specs.m2_slots_gen4 = parseInt(row.slots);
            specs.sata_ports = 6;
        }
        if (category === 'gpu') {
            if (row.vram_gb) specs.memory = row.vram_gb;
        }
        if (category === 'cpu') {
            if (row.clock_speed) specs.base_clock = row.clock_speed;
        }

        const images = [
            row.image_1, row.image_2, row.image_3, row.image_4, row.image_5, row.image_6
        ].filter(img => img && img.trim() !== '');

        const product = {
            id: row.id,
            name: row.name,
            category: row.category,
            brand: row.brand,
            price: parseInt(row.price) || 0,
            stock: parseInt(row.stock) || 0,
            sold: parseInt(row.sold) || 0,
            available: row.available === 'True' || row.available === 'true' || row.available === true,
            image: images[0] || '',
            images: images,
            specs: specs
        };

        products.push(product);
    }
    return products;
};

const run = async () => {
    try {
        console.log(`Reading CSV from ${csvPath}...`);
        const csvContent = fs.readFileSync(csvPath, 'utf-8');

        console.log('Parsing CSV...');
        const products = parseCSV(csvContent);
        console.log(`Parsed ${products.length} products.`);

        // Log a sample to verify mapping
        console.log('Sample Product (First Item):', JSON.stringify(products[0], null, 2));

        console.log('Sending to server...');
        const response = await axios.post('http://localhost:5001/api/products/batch', { products }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Server Response:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Server Error Data:', error.response.data);
        }
    }
};

run();
