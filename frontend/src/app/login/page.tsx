'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Lock, Mail, Sparkles, Scissors, ChevronRight } from 'lucide-react';

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
            setError(err.response?.data?.message || 'Credenciais inválidas. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#fdfcfb] selection:bg-amber-100">
            
            {/* Soft Ambient Light */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full blur-[140px] opacity-30" 
                    style={{ background: 'radial-gradient(circle, #fef3c7 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[140px] opacity-30" 
                    style={{ background: 'radial-gradient(circle, #f5f3ff 0%, transparent 70%)' }} />
            </div>

            <div className="w-full max-w-[460px] z-10 animate-fade-in text-center">
                
                {/* Branding Editorial */}
                <div className="mb-16">
                    <div className="inline-block relative mb-8">
                        <div className="absolute -inset-1 bg-amber-100 blur-xl opacity-40 rounded-full" />
                        <div className="relative w-12 h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-700">
                             <Scissors className="text-amber-600" size={32} strokeWidth={1} />
                        </div>
                    </div>
                    <h1 className="text-6xl font-serif font-medium tracking-tight text-[#1c1917] mb-3">
                        Bella Beauty
                    </h1>
                    <p className="text-[10px] font-bold tracking-[0.6em] uppercase text-amber-800/40">
                        The Hub of Excellence
                    </p>
                </div>

                {/* Form Section (No Card Border) */}
                <div className="max-w-[340px] mx-auto text-left space-y-12">
                    
                    <div className="space-y-1">
                        <h2 className="text-2xl font-serif text-stone-800 tracking-tight">Bonjour.</h2>
                        <p className="text-sm text-stone-400 font-medium">Acesse seu santuário de gestão.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                        
                        {/* E-mail */}
                        <div className="group relative border-b border-stone-200 focus-within:border-amber-400 transition-all duration-500 pb-2">
                            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-stone-300 mb-1 group-focus-within:text-amber-600 transition-colors">
                                Identidade Digital
                            </span>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-stone-300" strokeWidth={1.5} />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="seu@endereco.com"
                                    className="w-full bg-transparent py-2 text-[15px] outline-none text-stone-900 placeholder:text-stone-200 font-medium"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div className="group relative border-b border-stone-200 focus-within:border-amber-400 transition-all duration-500 pb-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-stone-300 group-focus-within:text-amber-600 transition-colors">
                                    Chave Secreta
                                </span>
                                <button type="button" className="text-[9px] font-bold text-stone-400 hover:text-amber-700 transition-colors uppercase tracking-widest">
                                    Recuperar
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <Lock size={16} className="text-stone-300" strokeWidth={1.5} />
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    className="w-full bg-transparent py-2 text-[15px] outline-none text-stone-900 placeholder:text-stone-200 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="text-stone-200 hover:text-stone-400 transition-colors"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Erro API */}
                        {error && (
                            <div className="bg-red-50/50 border-l-2 border-red-200 text-red-600 text-[11px] py-3 px-4 font-semibold animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Botão de Ação Luxury */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative group/btn overflow-hidden rounded-[40px] py-5 px-8 font-bold text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl shadow-amber-900/10 active:scale-[0.98] disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #451a03 0%, #1c1917 100%)',
                                    color: '#ffffff'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700" />
                                <div className="relative flex items-center justify-center gap-3">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Acessar Dashboard
                                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Discreto */}
                <div className="mt-24 opacity-30 flex items-center justify-center gap-6">
                    <span className="h-px w-8 bg-stone-300" />
                    <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.5em]">
                        Propriedade Bella Beauty 2026
                    </p>
                    <span className="h-px w-8 bg-stone-300" />
                </div>
            </div>
        </div>
    );
}
