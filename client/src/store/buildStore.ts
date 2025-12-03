import { create } from 'zustand';
import { Part, BasePart } from '@/lib/types';

interface BuildStore {
    selectedParts: Record<string, Part | Part[] | null>; // Changed to allow arrays (for storage)
    currentStep: string;
    setPart: (category: string, part: Part) => void;
    addStorage: (part: Part) => void;
    removeStorage: (index: number) => void;
    removePart: (category: string) => void;
    setStep: (step: string) => void;
    resetBuild: () => void;
}

export const useBuildStore = create<BuildStore>((set) => ({
    selectedParts: {},
    currentStep: 'cpu',
    setPart: (category, part) => set((state) => ({
        selectedParts: { ...state.selectedParts, [category]: part }
    })),
    addStorage: (part) => set((state) => {
        const currentStorage = (state.selectedParts['storage'] as Part[]) || [];
        return {
            selectedParts: { ...state.selectedParts, storage: [...currentStorage, part] }
        };
    }),
    removeStorage: (index) => set((state) => {
        const currentStorage = (state.selectedParts['storage'] as Part[]) || [];
        const newStorage = currentStorage.filter((_, i) => i !== index);
        return {
            selectedParts: { ...state.selectedParts, storage: newStorage }
        };
    }),
    removePart: (category) => set((state) => {
        const newParts = { ...state.selectedParts };
        delete newParts[category];
        return { selectedParts: newParts };
    }),
    setStep: (step) => set({ currentStep: step }),
    resetBuild: () => set({ selectedParts: {}, currentStep: 'cpu' })
}));
