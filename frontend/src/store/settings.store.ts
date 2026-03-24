import { create } from 'zustand';
import api from '@/lib/api';

interface SettingsData {
    plan: 'STANDARD' | 'PREMIUM';
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    planStartedAt?: string;
    planActiveUntil?: string;
}

interface SettingsState {
    settings: SettingsData | null;
    loading: boolean;
    fetchSettings: () => Promise<void>;
    updatePlan: (plan: string, cycle: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: null,
    loading: false,

    fetchSettings: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/settings');
            set({ settings: res.data });
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            set({ loading: false });
        }
    },

    updatePlan: async (plan, cycle) => {
        set({ loading: true });
        try {
            const res = await api.patch('/settings/plan', { plan, billingCycle: cycle });
            set({ settings: res.data });
        } catch (error) {
            console.error('Error updating plan:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    }
}));
