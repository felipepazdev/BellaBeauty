'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Scissors, Lock, Mail, Sparkles } from 'lucide-react';

const schema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(4, 'Senha muito curta'),
});
type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            setLoading(true);
            setError('');
            const res = await api.post('/auth/login', data);
            const { accessToken, user } = res.data;
            setAuth(user, accessToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#060608] relative overflow-hidden"
            style={{ 
                backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(212, 175, 55, 0.1) 0%, transparent 70%), radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)' 
            }}>
            
            {/* Elementos Decorativos de Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37]/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8b5cf6]/5 blur-[120px] rounded-full" />

            <div className="w-full max-w-[440px] animate-fade-in z-10">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="relative group mb-8">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37] to-[#f3d06b] rounded-[28px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-20 h-20 rounded-[28px] bg-[#0e0e14] border border-[#d4af37]/20 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110">
                            <Scissors size={32} className="text-[#d4af37]" strokeWidth={1.5} />
                            <div className="absolute -top-1 -right-1">
                                <Sparkles size={16} className="text-[#d4af37] animate-pulse" />
                            </div>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-2 leading-tight">
                        Bella Beauty
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
                        <p className="text-[10px] font-bold tracking-[0.3em] text-[#d4af37] uppercase">
                            Premium Beauty Experience
                        </p>
                        <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
                    </div>
                </div>

                {/* Card Container with Glassmorphism */}
                <div className="relative">
                    {/* Glow effect back of card */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-[#d4af37]/20 to-transparent rounded-[24px] pointer-events-none" />
                    
                    <div className="bg-[#14141e]/60 backdrop-blur-2xl border border-white/5 rounded-[24px] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                        <h2 className="text-lg font-serif font-medium mb-10 text-center text-white/70 italic italic-none tracking-wide">
                            Bem-vinda de volta
                        </h2>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

                            {/* Email Input */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest ml-1">
                                    E-mail de Acesso
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-[#475569] transition-colors group-focus-within:text-[#d4af37]" />
                                    </div>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-[#475569] outline-none transition-all focus:border-[#d4af37]/30 focus:bg-black/40 focus:ring-4 focus:ring-[#d4af37]/5"
                                    />
                                </div>
                                {errors.email && (
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1 ml-1">{errors.email.message}</span>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest ml-1">
                                        Sua Senha
                                    </label>
                                    <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] hover:text-[#f3d06b] transition-colors">
                                        Esqueceu?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-[#475569] transition-colors group-focus-within:text-[#d4af37]" />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-[#475569] outline-none transition-all focus:border-[#d4af37]/30 focus:bg-black/40 focus:ring-4 focus:ring-[#d4af37]/5"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#475569] hover:text-white transition-colors">
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1 ml-1">{errors.password.message}</span>
                                )}
                            </div>

                            {/* API Error Message */}
                            {error && (
                                <div className="rounded-2xl px-5 py-4 text-[11px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-400 animate-shake">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="group relative w-full h-14 mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#f3d06b] p-[1px] transition-all focus:ring-4 focus:ring-[#d4af37]/20 disabled:grayscale disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f3d06b] transition-all group-hover:scale-105 group-active:scale-95" />
                                <div className="relative flex items-center justify-center h-full w-full bg-[#14141e]/10 group-hover:bg-transparent transition-all rounded-[15px]">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white group-hover:text-black transition-colors">
                                            Acessar Plataforma
                                        </span>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6 mt-12">
                    <div className="flex items-center gap-4 text-[#475569]">
                        <div className="h-[1px] w-4 bg-[#475569]/20" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em]">
                            Exclusivo para Parceiros
                        </p>
                        <div className="h-[1px] w-4 bg-[#475569]/20" />
                    </div>
                    <p className="text-[9px] text-[#475569] font-medium tracking-widest uppercase">
                        © {new Date().getFullYear()} Bella Beauty · Excellence in Management
                    </p>
                </div>
            </div>
        </div>
    );
}
