'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Garante que o tema light seja aplicado, sobrescrevendo qualquer dark salvo
        const saved = localStorage.getItem('theme');
        if (!saved || saved === 'dark') {
            localStorage.setItem('theme', 'light');
        }
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
            {children}
        </ThemeProvider>
    );
}
