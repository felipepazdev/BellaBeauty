'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Lock, Mail, Sparkles, Scissors, ArrowRight, CheckCircle2 } from 'lucide-react';

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
        <div className="min-h-screen flex selection:bg-amber-100 bg-white">
            
            {/* LADO ESQUERDO: Imagem e Branding Imersivo */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-stone-900 overflow-hidden">
                <img 
                    src="/login_side_image_1775352779130.png" 
                    alt="Salão Bella Beauty" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/90 via-stone-900/40 to-transparent" />
                
                <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Scissors size={24} className="text-amber-400" />
                        </div>
                        <span className="text-2xl font-serif font-bold text-white tracking-tight">Bella Beauty</span>
                    </div>

                    <div className="max-w-md">
                        <h3 className="text-5xl font-serif font-bold text-white leading-[1.1] mb-6">
                            Gestão inteligente para sua arte.
                        </h3>
                        <p className="text-stone-300 text-lg font-light leading-relaxed mb-8">
                            O software que entende o luxo e a precisão do seu atendimento.
                        </p>
                        
                        <div className="space-y-4">
                            {[
                                'Agendamentos Inteligentes',
                                'Finanças Automatizadas',
                                'Fidelização de Clientes'
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3 text-stone-200">
                                    <CheckCircle2 size={18} className="text-amber-500" />
                                    <span className="text-sm font-medium tracking-wide">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.4em]">
                        Elevating Beauty Standards Since 2024
                    </p>
                </div>
            </div>

            {/* LADO DIREITO: Form de Login Moderno */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-20 relative bg-white">
                <div className="w-full max-w-[420px] animate-fade-in">
                    
                    {/* Header Mobile Only */}
                    <div className="lg:hidden flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                            <Scissors size={20} className="text-amber-600" />
                        </div>
                        <span className="text-xl font-serif font-bold text-stone-900 tracking-tight">Bella Beauty</span>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-4xl font-serif font-bold text-stone-900 mb-3 tracking-tight">Bem-vinda de volta</h2>
                        <p className="text-stone-500 font-medium">Insira suas credenciais para acessar o painel.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                        
                        {/* E-mail */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">
                                E-mail Institucional
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="seu@email.com"
                                className="w-full border-b-2 border-stone-100 py-4 px-1 text-[16px] text-stone-900 focus:border-amber-500 outline-none transition-all bg-transparent placeholder:text-stone-200"
                            />
                            {errors.email && (
                                <p className="text-[11px] font-bold text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2.5 relative">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">
                                    Senha Secreta
                                </label>
                                <button type="button" className="text-[10px] font-black text-amber-600 hover:text-amber-500 uppercase tracking-widest transition-colors">
                                    Esqueci?
                                </button>
                            </div>
                            <input
                                {...register('password')}
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full border-b-2 border-stone-100 py-4 px-1 pr-12 text-[16px] text-stone-900 focus:border-amber-500 outline-none transition-all bg-transparent placeholder:text-stone-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute bottom-4 right-1 text-stone-300 hover:text-stone-500 transition-colors"
                            >
                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {errors.password && (
                                <p className="text-[11px] font-bold text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* API Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs py-4 px-5 rounded-2xl font-bold border border-red-100 animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-stone-900 hover:bg-amber-600 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] shadow-xl shadow-stone-200 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Entrar no HUB
                                        <ArrowRight size={20} className="opacity-40" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Mobile Credits */}
                    <div className="mt-20 pt-8 border-t border-stone-50">
                        <div className="flex justify-between items-center opacity-40">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                                © {new Date().getFullYear()} Bella Beauty
                            </p>
                            <div className="flex gap-4">
                                <Sparkles size={14} className="text-amber-500" />
                                <Scissors size={14} className="text-stone-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slow-zoom {
                    0% { transform: scale(1.05); }
                    100% { transform: scale(1.15); }
                }
                .animate-slow-zoom {
                    animation: slow-zoom 20s ease-in-out infinite alternate;
                }
            `}</style>
        </div>
    );
}
