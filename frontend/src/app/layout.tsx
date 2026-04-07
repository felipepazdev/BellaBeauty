import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
    weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
    title: 'Bella Beauty – Gestão de Salão',
    description: 'Sistema de gestão profissional para salões de beleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
            <body className="antialiased" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
