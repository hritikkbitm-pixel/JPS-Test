'use client';

import React, { useEffect } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCart } from '@/context/CartContext';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/lib/data';
import { checkBuildHealth, BuildState } from '@/lib/compatibility';
import { Part } from '@/lib/types';
import { AlertTriangle, CheckCircle, XCircle, Info, Trash2, ShoppingCart, Cpu, Monitor, HardDrive, Zap, Box } from 'lucide-react';

const STEPS = [
    { id: 'cpu', label: 'Processor', icon: Cpu },
    { id: 'motherboard', label: 'Motherboard', icon: Box },
    { id: 'ram', label: 'Memory', icon: HardDrive },
    { id: 'gpu', label: 'Graphics Card', icon: Monitor },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'cooler', label: 'Cooling', icon: Zap },
    { id: 'psu', label: 'Power Supply', icon: Zap },
    { id: 'case', label: 'Case', icon: Box },
];

export default function PCBuilder() {
    const { selectedParts, setPart, removePart, addStorage, removeStorage, currentStep, setStep, resetBuild } = useBuildStore();
    const { addToCart } = useCart();
    const { products } = useShop();
    const isMounted = useIsMounted();

    // Map Product (nested specs) to Part (flat structure)
    const allParts: Part[] = products.map(p => {
        const specs = (p.specs || {}) as any;

        // Adapter logic to match compatibility engine requirements
        const adaptedSpecs: any = { ...specs };

        // Helper to normalize socket strings (e.g. "LGA 1700" -> "LGA1700")
        const normalize = (s: string) => String(s || '').replace(/\s+/g, '').toUpperCase();

        // 1. Motherboard: Map 'socket' to 'cpu_socket'
        if (p.category === 'motherboard') {
            adaptedSpecs.cpu_socket = normalize(specs.socket);
            if (specs.memory_type) adaptedSpecs.memory_type = specs.memory_type;
            if (specs.m2_slots) adaptedSpecs.m2_slots_gen4 = Number(specs.m2_slots); // Rough map
            if (specs.sata_ports) adaptedSpecs.sata_ports = Number(specs.sata_ports);
        }

        // 2. Cooler: Map 'socket_support' string to 'supported_sockets' array
        if (p.category === 'cooler') {
            adaptedSpecs.supported_sockets = specs.socket_support
                ? String(specs.socket_support).split(',').map((s: string) => normalize(s))
                : [];
            adaptedSpecs.height_mm = Number(specs.height) || 0;
            adaptedSpecs.type = String(specs.cooler_type || '').includes('Liquid') ? 'Liquid' : 'Air';
            adaptedSpecs.radiator_size_mm = Number(specs.radiator_size) || 0;
            adaptedSpecs.length_mm = Number(specs.length) || 300; // Default if missing
            adaptedSpecs.tdp = Number(specs.tdp) || 0;
        }

        // 3. Case: Map dimensions and supported mobos
        if (p.category === 'case') {
            adaptedSpecs.max_gpu_length_mm = Number(specs.gpu_max_length) || 400;
            adaptedSpecs.max_cpu_cooler_height_mm = Number(specs.cpu_cooler_max_height) || 180;

            const ffRaw = String(specs.form_factor || 'ATX').toUpperCase();
            if (ffRaw.includes('|')) {
                adaptedSpecs.supported_motherboards = ffRaw.split('|').map(s => s.trim());
            } else {
                const ff = ffRaw;
                if (ff === 'E-ATX') adaptedSpecs.supported_motherboards = ['E-ATX', 'ATX', 'mATX', 'ITX'];
                else if (ff === 'ATX') adaptedSpecs.supported_motherboards = ['ATX', 'mATX', 'ITX'];
                else if (ff === 'mATX' || ff === 'MICRO-ATX') adaptedSpecs.supported_motherboards = ['mATX', 'ITX'];
                else if (ff === 'ITX' || ff === 'MINI-ITX') adaptedSpecs.supported_motherboards = ['ITX'];
                else adaptedSpecs.supported_motherboards = [ff];
            }
            adaptedSpecs.supported_radiators = specs.radiator_support ? String(specs.radiator_support).split(',').map((s: string) => s.trim()) : [];
        }

        // 4. GPU: Dimensions
        if (p.category === 'gpu') {
            adaptedSpecs.length_mm = Number(specs.length) || 300;
            adaptedSpecs.tdp = Number(specs.tdp) || 0;
        }

        // 5. PSU: Wattage
        if (p.category === 'psu') {
            adaptedSpecs.wattage = Number(specs.wattage) || 0;
        }

        // 6. CPU: TDP
        if (p.category === 'cpu') {
            adaptedSpecs.tdp = Number(specs.tdp) || 0;
            // Also normalize CPU socket for matching
            adaptedSpecs.socket = normalize(specs.socket);
        }

        return {
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            brand: p.brand,
            category: p.category as any,
            ...adaptedSpecs
        } as Part;
    });

    // Calculate Compatibility
    const buildState: BuildState = {
        cpu: selectedParts['cpu'] as any,
        motherboard: selectedParts['motherboard'] as any,
        ram: selectedParts['ram'] as any,
        gpu: selectedParts['gpu'] as any,
        case: selectedParts['case'] as any,
        cooler: selectedParts['cooler'] as any,
        storage: (selectedParts['storage'] as any[]) || [],
        psu: selectedParts['psu'] as any,
    };

    const health = checkBuildHealth(buildState);
    const totalPrice = Object.values(selectedParts).reduce((acc, part) => {
        if (Array.isArray(part)) {
            return acc + part.reduce((sum, p) => sum + p.price, 0);
        }
        return acc + (part?.price || 0);
    }, 0);

    const handleAddToCart = () => {
        // Add single parts
        Object.entries(selectedParts).forEach(([key, part]) => {
            if (!part) return;
            if (key === 'storage' && Array.isArray(part)) {
                part.forEach(p => addToCart(p as any));
            } else if (!Array.isArray(part)) {
                addToCart(part as any);
            }
        });
    };

    // Filter parts for current step
    const rawAvailableParts = allParts.filter(p => p.category === currentStep);

    // Sort: Compatible first, then Incompatible
    const availableParts = rawAvailableParts.sort((a, b) => {
        // Evaluate A
        let buildA = { ...buildState };
        if (currentStep === 'storage') buildA.storage = [...(buildA.storage || []), a as any];
        else buildA = { ...buildState, [currentStep]: a };
        const healthA = checkBuildHealth(buildA);
        const isCompatibleA = healthA.valid || (healthA.errors.length === 0);

        // Evaluate B
        let buildB = { ...buildState };
        if (currentStep === 'storage') buildB.storage = [...(buildB.storage || []), b as any];
        else buildB = { ...buildState, [currentStep]: b };
        const healthB = checkBuildHealth(buildB);
        const isCompatibleB = healthB.valid || (healthB.errors.length === 0);

        if (isCompatibleA === isCompatibleB) return 0;
        return isCompatibleA ? -1 : 1; // Compatible comes first
    });

    const [showMobileSummary, setShowMobileSummary] = React.useState(false);

    // Prevent hydration mismatch by not rendering until mounted
    if (!isMounted) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans pb-32 md:pb-0">

            {/* MOBILE TOP NAV (Sticky) */}
            <div className="md:hidden sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm overflow-x-auto scrollbar-hide">
                <div className="flex px-4 py-3 gap-4 min-w-max">
                    {STEPS.map(step => {
                        const isCurrent = currentStep === step.id;
                        const isCompleted = !!selectedParts[step.id];
                        return (
                            <button
                                key={step.id}
                                onClick={() => setStep(step.id)}
                                className={`flex flex-col items-center gap-1 min-w-[60px] transition ${isCurrent ? 'opacity-100 scale-105' : 'opacity-60'}`}
                            >
                                <div className={`p-2 rounded-full ${isCurrent ? 'bg-brand-red text-white shadow-md' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-brand-red' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* LEFT PANEL: Build Summary (Desktop Sticky) */}
            <div className="hidden md:flex w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 p-6 flex-col h-screen sticky top-0 overflow-y-auto z-10 shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Build<span className="text-brand-red">Summary</span></h1>
                    <button onClick={resetBuild} className="text-xs text-red-500 font-bold hover:underline uppercase tracking-wider">Reset</button>
                </div>

                {/* Compatibility Badge */}
                <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${health.valid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {health.valid ? <CheckCircle className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
                    <div>
                        <div className="font-bold text-sm uppercase tracking-wide">{health.valid ? 'Compatibility: OK' : 'Compatibility Issues'}</div>
                        {!health.valid && (
                            <ul className="mt-2 text-xs list-disc pl-4 space-y-1">
                                {health.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                            </ul>
                        )}
                        {health.warnings.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-red-100">
                                <div className="font-bold text-xs uppercase text-yellow-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Warnings</div>
                                <ul className="mt-1 text-xs list-disc pl-4 space-y-1 text-yellow-800">
                                    {health.warnings.map((warn, idx) => <li key={idx}>{warn}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Power & Price */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-100 p-3 rounded text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase">Est. Wattage</div>
                        <div className="text-xl font-black text-gray-800">{health.estimatedWattage}W</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase">Total Price</div>
                        <div className="text-xl font-black text-brand-red">₹{totalPrice.toLocaleString()}</div>
                    </div>
                </div>

                {/* Selected Parts List */}
                <div className="flex-grow space-y-4">
                    {STEPS.map(step => {
                        const part = selectedParts[step.id];

                        // Special handling for Storage array
                        if (step.id === 'storage' && Array.isArray(part)) {
                            return (
                                <div key={step.id} className={`p-3 rounded border transition ${currentStep === step.id ? 'border-brand-red bg-red-50 ring-1 ring-brand-red' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                    <div className="flex justify-between items-center mb-1 cursor-pointer" onClick={() => setStep(step.id)}>
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase">
                                            <step.icon className="w-4 h-4" /> {step.label}
                                        </div>
                                    </div>
                                    {part.length > 0 ? (
                                        <div className="space-y-2 mt-2">
                                            {part.map((p, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded border">
                                                    <img src={p.image || "https://via.placeholder.com/64"} alt={p.name} className="w-8 h-8 object-contain" />
                                                    <div className="flex-grow min-w-0">
                                                        <div className="text-xs font-bold text-gray-800 truncate">{p.name}</div>
                                                        <div className="text-[10px] text-gray-500">₹{p.price.toLocaleString()}</div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); removeStorage(idx); }} className="text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div onClick={() => setStep(step.id)} className="text-xs text-gray-400 italic mt-1 cursor-pointer hover:text-brand-red">Select {step.label}...</div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={step.id} className={`p-3 rounded border transition ${currentStep === step.id ? 'border-brand-red bg-red-50 ring-1 ring-brand-red' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                <div className="flex justify-between items-center mb-1 cursor-pointer" onClick={() => setStep(step.id)}>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase">
                                        <step.icon className="w-4 h-4" /> {step.label}
                                    </div>
                                    {part && (
                                        <button onClick={(e) => { e.stopPropagation(); removePart(step.id); }} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {part ? (
                                    <div className="flex items-center gap-3 mt-2">
                                        <img src={(part as any).image || "https://via.placeholder.com/64"} alt={(part as any).name} className="w-10 h-10 object-contain bg-white rounded border p-1" />
                                        <div className="flex-grow min-w-0">
                                            <div className="text-xs font-bold text-gray-800 truncate">{(part as any).name}</div>
                                            <div className="text-[10px] text-gray-500">₹{(part as any).price.toLocaleString()}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => setStep(step.id)} className="text-xs text-gray-400 italic mt-1 cursor-pointer hover:text-brand-red">Select {step.label}...</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleAddToCart}
                    className="mt-6 w-full bg-brand-red text-white font-bold py-4 rounded-lg hover:bg-red-700 transition uppercase tracking-wider shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!health.valid || Object.keys(selectedParts).length === 0}
                >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
            </div>

            {/* RIGHT PANEL: Selection Area */}
            <div className="flex-grow p-4 md:p-8 overflow-y-auto min-h-screen">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2 uppercase tracking-tight">Select {STEPS.find(s => s.id === currentStep)?.label}</h2>
                    <p className="text-gray-500 mb-8 text-sm md:text-base">Choose a component for your build. Incompatible parts are automatically disabled.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {availableParts.map(part => {
                            // Check compatibility for THIS specific part against current build
                            // We temporarily add this part to the build state to check if it causes errors
                            let tempBuild = { ...buildState };

                            if (currentStep === 'storage') {
                                // For storage, we append to array to check
                                tempBuild.storage = [...(tempBuild.storage || []), part as any];
                            } else {
                                tempBuild = { ...buildState, [currentStep]: part };
                            }

                            const tempHealth = checkBuildHealth(tempBuild);
                            const isCompatible = tempHealth.valid || (tempHealth.errors.length === 0);

                            const isSelected = currentStep === 'storage'
                                ? (selectedParts['storage'] as any[])?.some(p => p.id === part.id)
                                : (selectedParts[currentStep] as any)?.id === part.id;

                            return (
                                <div key={part.id} className={`bg-white rounded-lg border p-4 flex flex-col transition group relative ${isSelected ? 'border-brand-red ring-2 ring-brand-red' : 'border-gray-200 hover:shadow-md'} ${!isCompatible ? 'opacity-50 grayscale' : ''}`}>
                                    {!isCompatible && (
                                        <div className="absolute top-2 right-2 text-red-500" title="Incompatible with current build">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="h-40 flex items-center justify-center mb-4 bg-gray-50 rounded p-2">
                                        <img src={part.image || "https://via.placeholder.com/300"} alt={part.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">{part.brand}</div>
                                        <h3 className="font-bold text-gray-800 leading-tight mb-2">{part.name}</h3>

                                        {/* Specs Preview */}
                                        <div className="text-xs text-gray-500 space-y-1 mb-4">
                                            {part.category === 'cpu' && <div>Socket: {(part as any).socket} | TDP: {(part as any).tdp}W</div>}
                                            {part.category === 'motherboard' && <div>Socket: {(part as any).cpu_socket} | {(part as any).form_factor}</div>}
                                            {part.category === 'gpu' && <div>Length: {(part as any).length_mm}mm | TDP: {(part as any).tdp}W</div>}
                                            {part.category === 'case' && <div>Max GPU: {(part as any).max_gpu_length_mm}mm</div>}
                                            {part.category === 'psu' && <div>{(part as any).wattage}W | {(part as any).form_factor}</div>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                        <div className="font-black text-lg text-gray-800">₹{part.price.toLocaleString()}</div>
                                        {isSelected ? (
                                            <button
                                                onClick={() => currentStep === 'storage' ? removeStorage((selectedParts['storage'] as any[]).findIndex(p => p.id === part.id)) : removePart(currentStep)}
                                                className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold uppercase hover:bg-red-200 transition"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (currentStep === 'storage') {
                                                        addStorage(part);
                                                    } else {
                                                        setPart(currentStep, part);
                                                    }
                                                }}
                                                disabled={!isCompatible}
                                                className={`px-4 py-2 rounded text-xs font-bold uppercase transition ${isCompatible ? 'bg-black text-white hover:bg-brand-red' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {isCompatible ? 'Select' : 'Incompatible'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM BAR (Sticky) */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase font-bold text-gray-500">Total Price</div>
                    <div className="text-xl font-black text-brand-red">₹{totalPrice.toLocaleString()}</div>
                </div>
                <button
                    onClick={() => setShowMobileSummary(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg ${health.valid ? 'bg-gray-900 text-white' : 'bg-red-100 text-red-600'}`}
                >
                    {health.valid ? 'Review Build' : 'Issues Found'}
                    <span className="bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {Object.values(selectedParts).filter(p => Array.isArray(p) ? p.length > 0 : !!p).length}
                    </span>
                </button>
            </div>

            {/* MOBILE SUMMARY MODAL */}
            {showMobileSummary && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-end md:hidden animate-fade-in">
                    <div className="bg-white w-full rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h3 className="font-black text-lg uppercase text-gray-800">Your Build</h3>
                                <div className={`text-xs font-bold ${health.valid ? 'text-green-600' : 'text-red-600'}`}>
                                    {health.valid ? 'All Parts Compatible' : 'Compatibility Issues Found'}
                                </div>
                            </div>
                            <button onClick={() => setShowMobileSummary(false)} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300">
                                <XCircle className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-grow space-y-4">
                            {/* Copy of Desktop Summary Content */}
                            {/* Power */}
                            <div className="flex justify-between bg-gray-100 p-3 rounded">
                                <span className="text-xs font-bold uppercase text-gray-500">Est. Wattage</span>
                                <span className="font-bold text-gray-800">{health.estimatedWattage}W</span>
                            </div>

                            {/* Warnings/Errors */}
                            {!health.valid && (
                                <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700 text-xs">
                                    <ul className="list-disc pl-4 space-y-1">
                                        {health.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Parts List Mobile */}
                            <div className="space-y-3">
                                {STEPS.map(step => {
                                    const part = selectedParts[step.id];
                                    if (!part || (Array.isArray(part) && part.length === 0)) return null;

                                    if (Array.isArray(part)) {
                                        return part.map((p, idx) => (
                                            <div key={`${step.id}-${idx}`} className="flex items-center gap-3 bg-white border p-2 rounded-lg relative">
                                                <img src={p.image || "https://via.placeholder.com/64"} alt={p.name} className="w-12 h-12 object-contain" />
                                                <div className="flex-grow min-w-0">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">{step.label}</div>
                                                    <div className="text-xs font-bold text-gray-800 truncate">{p.name}</div>
                                                    <div className="text-xs text-gray-500">₹{p.price.toLocaleString()}</div>
                                                </div>
                                                <button onClick={() => removeStorage(idx)} className="text-gray-400 hover:text-red-500 p-2">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ));
                                    }

                                    return (
                                        <div key={step.id} className="flex items-center gap-3 bg-white border p-2 rounded-lg relative">
                                            <img src={(part as any).image || "https://via.placeholder.com/64"} alt={(part as any).name} className="w-12 h-12 object-contain" />
                                            <div className="flex-grow min-w-0">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">{step.label}</div>
                                                <div className="text-xs font-bold text-gray-800 truncate">{(part as any).name}</div>
                                                <div className="text-xs text-gray-500">₹{(part as any).price.toLocaleString()}</div>
                                            </div>
                                            <button onClick={() => removePart(step.id)} className="text-gray-400 hover:text-red-500 p-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t bg-white">
                            <button
                                onClick={handleAddToCart}
                                disabled={!health.valid || Object.keys(selectedParts).length === 0}
                                className="w-full bg-brand-red text-white font-bold py-4 rounded-lg hover:bg-red-700 transition uppercase tracking-wider shadow-md disabled:opacity-50"
                            >
                                Add to Cart (₹{totalPrice.toLocaleString()})
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
