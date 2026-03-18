import { create } from 'zustand';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'PROFESSIONAL';
    salonId: string;
    professionalId?: string;
    permissions?: string;
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    setAuth: (user: AuthUser, token: string) => void;
    logout: () => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,

    setAuth: (user, token) => {
        localStorage.setItem('bb_token', token);
        localStorage.setItem('bb_user', JSON.stringify(user));
        set({ user, token });
    },

    logout: () => {
        localStorage.removeItem('bb_token');
        localStorage.removeItem('bb_user');
        set({ user: null, token: null });
    },

    hydrate: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('bb_token');
        const userStr = localStorage.getItem('bb_user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as AuthUser;
                set({ user, token });
            } catch {
                // ignore
            }
        }
    },
}));
