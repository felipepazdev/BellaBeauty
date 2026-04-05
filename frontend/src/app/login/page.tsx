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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-amber-100"
            style={{
                background: 'linear-gradient(135deg, #fdf8f4 0%, #ffffff 40%, #f7f1ff 100%)',
            }}>
            
            {/* Mesh Gradient Animado (Simulado) */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-30 blur-[100px] animate-pulse"
                style={{ background: 'radial-gradient(circle, #e9d5ff 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-25 blur-[100px] animate-pulse"
                style={{ background: 'radial-gradient(circle, #fee2e2 0%, transparent 70%)' }} />
            <div className="absolute top-[20%] right-[5%] w-[40%] h-[40%] rounded-full opacity-20 blur-[80px]"
                style={{ background: 'radial-gradient(circle, #fef3c7 0%, transparent 70%)' }} />

            <div className="w-full max-w-[440px] z-10 animate-fade-in">
                
                {/* Logo e Título */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-3xl opacity-20 blur-xl" style={{ background: 'var(--accent-gold)' }} />
                        <div className="relative w-20 h-20 bg-white/80 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                            <Scissors size={32} className="text-amber-600" strokeWidth={1} />
                            <div className="absolute -top-1 -right-1">
                                <Sparkles size={16} className="text-amber-400 animate-bounce" />
                            </div>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-serif font-medium tracking-tight mb-2" style={{ color: '#1c1917' }}>
                        Bella Beauty
                    </h1>
                    <p className="text-[11px] font-bold tracking-[0.4em] uppercase opacity-40" style={{ color: '#1c1917' }}>
                        Beauty Business Hub
                    </p>
                </div>

                {/* Card de Login (Glassmorphism) */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-200/20 to-purple-200/20 rounded-[32px] blur opacity-30" />
                    <div className="relative bg-white/70 backdrop-blur-2xl rounded-[30px] border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
                        
                        <div className="px-10 py-12">
                            <div className="mb-10 text-center">
                                <h2 className="text-xl font-medium tracking-tight text-stone-800">
                                    Bem-vinda de volta
                                </h2>
                                <p className="text-xs text-stone-400 mt-1">Acesse sua conta com seus dados abaixo</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                
                                {/* E-mail */}
                                <div className="space-y-2">
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within/input:text-amber-600 transition-colors">
                                            <Mail size={18} strokeWidth={1.5} />
                                        </div>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="E-mail de acesso"
                                            className="w-full bg-white/50 border border-stone-100 py-4 pl-12 pr-4 rounded-2xl text-[15px] outline-none transition-all focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-100/50"
                                            style={{ color: '#1c1917' }}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-[11px] font-semibold text-red-500 pl-2">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Senha */}
                                <div className="space-y-2">
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within/input:text-amber-600 transition-colors">
                                            <Lock size={18} strokeWidth={1.5} />
                                        </div>
                                        <input
                                            {...register('password')}
                                            type={showPass ? 'text' : 'password'}
                                            placeholder="Sua senha secreta"
                                            className="w-full bg-white/50 border border-stone-100 py-4 pl-12 pr-12 rounded-2xl text-[15px] outline-none transition-all focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-100/50"
                                            style={{ color: '#1c1917' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-300 hover:text-stone-500 transition-colors"
                                        >
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        {errors.password ? (
                                            <p className="text-[11px] font-semibold text-red-500">{errors.password.message}</p>
                                        ) : <div />}
                                        <button type="button" className="text-[11px] font-bold text-amber-700 hover:text-amber-500 transition-colors uppercase tracking-wider">
                                            Esqueceu?
                                        </button>
                                    </div>
                                </div>

                                {/* Erro API */}
                                {error && (
                                    <div className="bg-red-50/50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-medium text-center animate-shake">
                                        {error}
                                    </div>
                                )}

                                {/* Botão Submeter */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full group/btn relative py-4 px-6 rounded-2xl font-bold text-sm text-white transition-all overflow-hidden disabled:opacity-50"
                                    style={{
                                        background: 'linear-gradient(135deg, #451a03 0%, #1c1917 100%)',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                                    <div className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Acessar Sistema
                                                <ChevronRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Rodapé Moderno */}
                <div className="mt-12 text-center space-y-4">
                    <div className="flex items-center justify-center gap-6">
                        <span className="h-px w-8 bg-stone-200" />
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.4em]">Propriedade Bella Beauty</span>
                        <span className="h-px w-8 bg-stone-200" />
                    </div>
                    <p className="text-[10px] font-medium text-stone-400">
                        Copyright © {new Date().getFullYear()} · Todos os direitos reservados
                    </p>
                </div>
            </div>
        </div>
    );
}
