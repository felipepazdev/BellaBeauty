'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Lock, Mail, Sparkles, Scissors, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center p-4 selection:bg-amber-100" 
            style={{ background: '#fdfcfe' }}>
            
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-40" 
                    style={{ background: 'radial-gradient(circle, #f3e8ff 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-40" 
                    style={{ background: 'radial-gradient(circle, #fff7ed 0%, transparent 70%)' }} />
            </div>

            <div className="w-full max-w-[400px] z-10 animate-fade-in">
                
                {/* Branding Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl shadow-amber-500/10 mb-6 border border-amber-50/50">
                        <Scissors className="text-amber-600" size={28} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 mb-2">
                        Bella Beauty
                    </h1>
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-amber-700/60">
                        Premium Management
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-stone-100 p-8 sm:p-10">
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-stone-800">Bem-vinda 👋</h2>
                        <p className="text-sm text-stone-400 mt-1">Acesse sua conta para gerenciar seu salão.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* E-mail Input */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider ml-1">
                                E-mail institucional
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-300 group-focus-within:text-amber-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="w-full bg-stone-50 border border-stone-100 py-4 pl-12 pr-4 rounded-2xl text-[15px] text-stone-900 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 outline-none transition-all placeholder:text-stone-300"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-[11px] font-medium text-red-500 pl-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                    Senha secreta
                                </label>
                                <button type="button" className="text-[10px] font-bold text-amber-700 hover:text-amber-600 uppercase tracking-tighter">
                                    Esqueci minha senha
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-300 group-focus-within:text-amber-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full bg-stone-50 border border-stone-100 py-4 pl-12 pr-12 rounded-2xl text-[15px] text-stone-900 focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-50 outline-none transition-all placeholder:text-stone-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute inset-y-0 right-4 flex items-center text-stone-300 hover:text-stone-500 transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] font-medium text-red-500 pl-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* API Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs py-3 px-4 rounded-xl font-medium border border-red-100 animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Acessar Painel
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        © {new Date().getFullYear()} Bella Beauty Software
                    </p>
                    <p className="text-[9px] text-stone-300 font-medium">
                        Tecnologia para beleza e bem-estar
                    </p>
                </div>
            </div>
        </div>
    );
}
