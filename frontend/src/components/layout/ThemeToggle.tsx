'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95"
            title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
            style={{
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
            }}
        >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}
