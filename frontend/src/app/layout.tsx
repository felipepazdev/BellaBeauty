import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'Bella Beauty – Gestão de Salão',
    description: 'Sistema de gestão profissional para salões de beleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" className={inter.variable}>
            <body className="bg-[#0f0f13] text-white antialiased">{children}</body>
        </html>
    );
}
