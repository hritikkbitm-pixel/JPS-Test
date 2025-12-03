import { Part, CPU, Motherboard, RAM, GPU, Case, Cooler, Storage, PSU } from './types';

export interface BuildState {
    cpu?: CPU;
    motherboard?: Motherboard;
    ram?: RAM;
    gpu?: GPU;
    case?: Case;
    cooler?: Cooler;
    storage?: Storage[];
    psu?: PSU;
}

export interface CompatibilityResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    estimatedWattage: number;
}

export function checkBuildHealth(parts: BuildState): CompatibilityResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let estimatedWattage = 0;

    // --- 1. Socket & Platform Compatibility ---
    if (parts.cpu && parts.motherboard) {
        if (parts.cpu.socket !== parts.motherboard.cpu_socket) {
            errors.push(`Incompatible Socket: CPU (${parts.cpu.socket}) does not match Motherboard (${parts.motherboard.cpu_socket}).`);
        }
    }

    if (parts.cpu && parts.cooler) {
        if (!parts.cooler.supported_sockets.includes(parts.cpu.socket)) {
            errors.push(`Incompatible Cooler: Cooler does not support CPU socket (${parts.cpu.socket}).`);
        }
    }

    if (parts.motherboard && parts.ram) {
        if (parts.motherboard.memory_type !== parts.ram.memory_type) {
            errors.push(`Incompatible RAM: Motherboard requires ${parts.motherboard.memory_type}, but RAM is ${parts.ram.memory_type}.`);
        }
    }

    // --- 2. Physical Constraints ---
    if (parts.case && parts.motherboard) {
        if (!parts.case.supported_motherboards.includes(parts.motherboard.form_factor)) {
            errors.push(`Incompatible Case: Case does not support ${parts.motherboard.form_factor} motherboards.`);
        }
    }

    if (parts.case && parts.gpu) {
        if (parts.gpu.length_mm > parts.case.max_gpu_length_mm) {
            errors.push(`Physical Clearance: GPU length (${parts.gpu.length_mm}mm) exceeds Case maximum (${parts.case.max_gpu_length_mm}mm).`);
        }
    }

    if (parts.case && parts.cooler) {
        if (parts.cooler.type === 'Air') {
            if (parts.cooler.height_mm > parts.case.max_cpu_cooler_height_mm) {
                errors.push(`Physical Clearance: Cooler height (${parts.cooler.height_mm}mm) exceeds Case maximum (${parts.case.max_cpu_cooler_height_mm}mm).`);
            }
        } else if (parts.cooler.type === 'Liquid') {
            const radSize = parts.cooler.radiator_size_mm.toString();
            if (!parts.case.supported_radiators.includes(radSize)) {
                errors.push(`Physical Clearance: Case does not support ${radSize}mm radiators.`);
            }
        }
    }

    // --- Storage Checks ---
    if (parts.motherboard && parts.storage && parts.storage.length > 0) {
        const nvmeCount = parts.storage.filter(s => s.type === 'NVMe').length;
        const sataCount = parts.storage.filter(s => s.type === 'SATA' || s.form_factor === '2.5').length; // Assuming SATA/2.5" are SATA ports

        if (nvmeCount > parts.motherboard.m2_slots_gen4) {
            errors.push(`Storage Limit: Motherboard only has ${parts.motherboard.m2_slots_gen4} M.2 slots (Selected: ${nvmeCount} NVMe drives).`);
        }

        if (sataCount > (parts.motherboard.sata_ports || 4)) { // Default to 4 if undefined
            errors.push(`Storage Limit: Motherboard only has ${parts.motherboard.sata_ports || 4} SATA ports (Selected: ${sataCount} SATA drives).`);
        }
    }

    // --- 3. Power Calculation ---
    if (parts.cpu) estimatedWattage += parts.cpu.tdp;
    if (parts.gpu) estimatedWattage += parts.gpu.tdp;

    // Base overhead for Mobo, RAM, Fans, Storage
    estimatedWattage += 50;
    if (parts.storage) estimatedWattage += (parts.storage.length * 5); // 5W per drive roughly
    if (parts.ram) estimatedWattage += 10; // RAM overhead

    if (parts.psu) {
        const recommended = Math.ceil(estimatedWattage * 1.5);
        if (parts.psu.wattage < estimatedWattage) {
            errors.push(`Insufficient Power: Estimated usage (${estimatedWattage}W) exceeds PSU wattage (${parts.psu.wattage}W).`);
        } else if (parts.psu.wattage < recommended) {
            warnings.push(`Low Power Headroom: Recommended PSU is ${recommended}W for safe operation (Current: ${parts.psu.wattage}W).`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        estimatedWattage
    };
}
