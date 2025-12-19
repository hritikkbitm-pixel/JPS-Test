const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../data/templates');

// Ensure directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Category Schemas (Headers only)
const CATEGORIES = {
    'cpus.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "socket", "chipset_compatibility", "architecture", "tdp", "max_memory_speed",
        "memory_type", "pci_express_version", "integrated_gpu", "cooler_included",
        "air_cooler_recommended", "liquid_cooler_recommended", "cores", "threads",
        "base_clock", "boost_clock", "cache_l1", "cache_l2", "cache_l3",
        "performance_score", "gaming_score", "productivity_score", "recommended_psu_wattage",
        "manufacturing_process", "max_temp", "unlocked", "short_description",
        "key_features", "long_description", "warranty"
    ],
    'motherboards.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "socket", "chipset", "form_factor", "memory_type", "max_memory_speed", "memory_slots",
        "max_memory_capacity", "pci_express_version", "pci_express_slots", "m2_slots",
        "sata_ports", "usb_ports", "vrm_phases", "wifi", "builtin_gpu_support", "tdp_support",
        "bios_flashback", "overclock_support", "performance_score", "gaming_score",
        "recommended_cpus", "recommended_psu_wattage", "short_description", "key_features",
        "long_description", "warranty"
    ],
    'gpus.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "chipset", "architecture", "base_clock", "boost_clock", "vram_size", "vram_type",
        "memory_speed", "memory_bus", "pci_express_version", "tdp", "recommended_psu_wattage",
        "power_connectors", "display_ports", "hdmi_ports", "max_resolution", "ray_tracing",
        "dlss_fsr_support", "cooling_type", "fans", "length", "performance_score",
        "gaming_score", "productivity_score", "short_description", "key_features", "long_description", "warranty"
    ],
    'ram.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "memory_type", "capacity_per_stick", "sticks", "total_capacity", "speed", "cas_latency",
        "channels", "voltage", "ecc_support", "xmp_expo_support", "heat_spreader_color",
        "height", "performance_score", "short_description", "key_features", "long_description", "warranty"
    ],
    'storage.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "storage_type", "interface", "form_factor", "capacity", "read_speed", "write_speed",
        "nand_type", "dram_cache", "endurance_tbw", "mtbf", "controller", "performance_score",
        "boot_drive_recommended", "short_description", "key_features", "long_description", "warranty"
    ],
    'psu.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "wattage", "efficiency_rating", "modularity", "atx_version", "pci_express_5_support",
        "eps_connectors", "pci_connectors", "sata_connectors", "fan_size", "smart_fan_control",
        "build_quality_score", "performance_score", "recommended_for_gpus", "short_description",
        "key_features", "long_description", "warranty"
    ],
    'cabinets.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "form_factor", "side_panel", "fan_support", "radiator_support", "gpu_max_length",
        "cpu_cooler_max_height", "psu_max_length", "preinstalled_fans", "expansion_slots",
        "front_io", "build_quality_score", "airflow_score", "short_description", "key_features",
        "long_description", "warranty"
    ],
    'coolers.csv': [
        "id", "brand", "series", "model", "full_name", "price", "stock_status", "image_url",
        "cooler_type", "tdp_rating", "socket_support", "fans", "fans_rpm", "noise_level",
        "radiator_size", "height", "pump_speed", "rgb", "performance_score",
        "recommended_for_cpus", "short_description", "key_features", "long_description", "warranty"
    ]
};

// Generate Files
Object.entries(CATEGORIES).forEach(([filename, headers]) => {
    const filePath = path.join(TEMPLATES_DIR, filename);
    const csvContent = headers.map(h => `"${h}"`).join(",") + "\n"; // Header row only
    fs.writeFileSync(filePath, csvContent);
    console.log(`Generated template: ${filename}`);
});

console.log(`\nAll templates generated in: ${TEMPLATES_DIR}`);
