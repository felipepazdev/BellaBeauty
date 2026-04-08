'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Garante que o tema dark (Vapor Clinic) seja o padrão
        const saved = localStorage.getItem('theme');
        if (!saved || saved === 'light') {
            localStorage.setItem('theme', 'dark');
        }
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="dark">{children}</div>;
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="theme">
            {children}
        </ThemeProvider>
    );
}
