const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const inputFile = path.join(__dirname, 'jps-inventory-updated.csv');
const outputDir = path.join(__dirname, '../data/products');

const schemas = {
    cpu: {
        file: 'cpus.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'socket', 'chipset_compatibility', 'architecture', 'tdp', 'max_memory_speed', 'memory_type', 'pci_express_version', 'integrated_gpu', 'cooler_included', 'air_cooler_recommended', 'liquid_cooler_recommended', 'cores', 'threads', 'base_clock', 'boost_clock', 'cache_l1', 'cache_l2', 'cache_l3', 'performance_score', 'gaming_score', 'productivity_score', 'recommended_psu_wattage', 'manufacturing_process', 'max_temp', 'unlocked', 'short_description', 'key_features', 'long_description', 'warranty']
    },
    motherboard: {
        file: 'motherboards.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'socket', 'chipset', 'form_factor', 'memory_type', 'max_memory_speed', 'memory_slots', 'max_memory_capacity', 'pci_express_version', 'pci_express_slots', 'm2_slots', 'sata_ports', 'usb_ports', 'vrm_phases', 'wifi', 'builtin_gpu_support', 'tdp_support', 'bios_flashback', 'overclock_support', 'performance_score', 'gaming_score', 'recommended_cpus', 'recommended_psu_wattage', 'short_description', 'key_features', 'long_description', 'warranty']
    },
    gpu: {
        file: 'gpus.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'chipset', 'architecture', 'base_clock', 'boost_clock', 'vram_size', 'vram_type', 'memory_speed', 'memory_bus', 'pci_express_version', 'tdp', 'recommended_psu_wattage', 'power_connectors', 'display_ports', 'hdmi_ports', 'max_resolution', 'ray_tracing', 'dlss_fsr_support', 'cooling_type', 'fans', 'length', 'performance_score', 'gaming_score', 'productivity_score', 'short_description', 'key_features', 'long_description', 'warranty'] // Added length
    },
    ram: {
        file: 'ram.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'memory_type', 'capacity_per_stick', 'sticks', 'total_capacity', 'speed', 'cas_latency', 'channels', 'voltage', 'ecc_support', 'xmp_expo_support', 'heat_spreader_color', 'height', 'performance_score', 'short_description', 'key_features', 'long_description', 'warranty']
    },
    storage: {
        file: 'storage.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'storage_type', 'interface', 'form_factor', 'capacity', 'read_speed', 'write_speed', 'nand_type', 'dram_cache', 'endurance_tbw', 'mtbf', 'controller', 'performance_score', 'boot_drive_recommended', 'short_description', 'key_features', 'long_description', 'warranty']
    },
    psu: {
        file: 'psu.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'wattage', 'efficiency_rating', 'modularity', 'atx_version', 'pci_express_5_support', 'eps_connectors', 'pci_connectors', 'sata_connectors', 'fan_size', 'smart_fan_control', 'build_quality_score', 'performance_score', 'recommended_for_gpus', 'short_description', 'key_features', 'long_description', 'warranty']
    },
    case: {
        file: 'cabinets.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'form_factor', 'side_panel', 'fan_support', 'radiator_support', 'gpu_max_length', 'cpu_cooler_max_height', 'psu_max_length', 'preinstalled_fans', 'expansion_slots', 'front_io', 'build_quality_score', 'airflow_score', 'short_description', 'key_features', 'long_description', 'warranty']
    },
    cooler: {
        file: 'coolers.csv',
        fields: ['id', 'brand', 'series', 'model', 'full_name', 'price', 'stock_status', 'image_url', 'cooler_type', 'tdp_rating', 'socket_support', 'fans', 'fans_rpm', 'noise_level', 'radiator_size', 'height', 'pump_speed', 'rgb', 'performance_score', 'recommended_for_cpus', 'short_description', 'key_features', 'long_description', 'warranty']
    }
};

const categorizedData = {};
Object.keys(schemas).forEach(key => categorizedData[key] = []);

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        const category = row.category ? row.category.toLowerCase() : '';
        if (schemas[category]) {
            // Map existing data to new schema best effort
            const newRow = {};
            const fields = schemas[category].fields;

            fields.forEach(field => {
                // Map core fields
                if (field === 'id') newRow[field] = row.id;
                else if (field === 'brand') newRow[field] = row.brand;
                else if (field === 'full_name') newRow[field] = row.name;
                else if (field === 'price') newRow[field] = row.price;
                else if (field === 'stock_status') newRow[field] = (row.available === 'True' || row.available === 'true') ? 'In Stock' : 'Out of Stock';
                else if (field === 'image_url') newRow[field] = row.image_1 || row.image || '';

                // Map tech specs from jps-inventory-updated.csv columns
                else if (field === 'tdp' && row.tdp_watts) newRow[field] = row.tdp_watts;
                else if (field === 'socket' && row.socket) newRow[field] = row.socket;
                else if (field === 'chipset' && row.chipset) newRow[field] = row.chipset;
                else if (field === 'form_factor' && row.form_factor) newRow[field] = row.form_factor;
                else if (field === 'memory_type' && row.memory_type) newRow[field] = row.memory_type;
                else if (field === 'vram_size' && row.vram_gb) newRow[field] = row.vram_gb;
                else if (field === 'length' && row.length_mm) newRow[field] = row.length_mm;
                else if (field === 'height' && row.height_mm) newRow[field] = row.height_mm;
                else if (field === 'capacity' && row.capacity_gb) newRow[field] = row.capacity_gb;
                else if (field === 'total_capacity' && row.capacity_gb) newRow[field] = row.capacity_gb; // Assuming single Stick cap for now or total?
                else if (field === 'base_clock' && row.clock_speed) newRow[field] = row.clock_speed;
                // Add more specific mappings if needed

                // Default fallbacks
                else if (row[field]) newRow[field] = row[field];
                else newRow[field] = '';
            });

            categorizedData[category].push(newRow);
        }
    })
    .on('end', () => {
        Object.keys(schemas).forEach(key => {
            const schema = schemas[key];
            const data = categorizedData[key];

            if (data.length >= 0) { // Create file even if empty to establish schema
                const json2csvParser = new Parser({ fields: schema.fields });
                const csvData = json2csvParser.parse(data);
                fs.writeFileSync(path.join(outputDir, schema.file), csvData);
                console.log(`Created ${schema.file} with ${data.length} items.`);
            }
        });
        console.log('Migration complete.');
    });
