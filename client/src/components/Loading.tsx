import React from 'react';
import { Power } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
            <div className="relative flex items-center justify-center w-24 h-24">
                {/* Outer Spinning Ring (Fan/Cooling effect) */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 opacity-30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-brand-red border-r-transparent border-b-brand-red border-l-transparent animate-spin shadow-[0_0_15px_rgba(237,28,36,0.3)]"></div>

                {/* Inner Pulsing Glow */}
                <div className="absolute inset-0 rounded-full bg-brand-red/5 animate-pulse"></div>

                {/* Power Icon */}
                <div className="relative z-10 bg-white rounded-full p-4 shadow-sm">
                    <Power className="w-8 h-8 text-brand-red animate-pulse drop-shadow-[0_0_8px_rgba(237,28,36,0.5)]" strokeWidth={3} />
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <h3 className="text-brand-dark font-black tracking-[0.3em] text-xl uppercase">
                    System Booting
                </h3>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}
