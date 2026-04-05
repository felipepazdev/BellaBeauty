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
            setError(err.response?.data?.message || 'Credenciais inválidas. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #fdf8ff 0%, #f5f0ff 40%, #fef9f0 100%)',
            }}
        >
            {/* Elementos decorativos de fundo */}
            <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />

            <div className="w-full max-w-[420px] animate-fade-in z-10">

                {/* Logo */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="relative group mb-6">
                        <div className="absolute -inset-2 rounded-[28px] opacity-20 group-hover:opacity-40 transition-all duration-700"
                            style={{ background: 'linear-gradient(135deg, #d4af37, #f3d06b)', filter: 'blur(12px)' }} />
                        <div className="relative w-16 h-16 rounded-[20px] flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #fff9ec, #fffef9)',
                                border: '1px solid rgba(212,175,55,0.3)',
                                boxShadow: '0 4px 20px rgba(212,175,55,0.15)'
                            }}>
                            <Scissors size={28} style={{ color: '#b48c26' }} strokeWidth={1.5} />
                            <div className="absolute -top-1 -right-1">
                                <Sparkles size={14} style={{ color: '#d4af37' }} className="animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-serif font-bold tracking-tight mb-1.5" style={{ color: '#1a1208' }}>
                        Bella Beauty
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, rgba(180,140,38,0.4))' }} />
                        <p className="text-[10px] font-bold tracking-[0.28em] uppercase" style={{ color: '#b48c26' }}>
                            Gestão de Salão
                        </p>
                        <div className="h-px w-8" style={{ background: 'linear-gradient(to left, transparent, rgba(180,140,38,0.4))' }} />
                    </div>
                </div>

                {/* Card principal */}
                <div className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.92)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                        backdropFilter: 'blur(16px)',
                    }}>
                    
                    <div className="px-8 py-7">
                        <h2 className="text-base font-medium text-center mb-7" style={{ color: '#6b7280' }}>
                            Bem-vinda de volta 👋
                        </h2>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                            {/* Campo E-mail */}
                            <div className="flex flex-col gap-1.5">
                                <label className="form-label">
                                    E-mail de acesso
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={16} style={{ color: '#9ca3af' }} />
                                    </div>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="seu@email.com"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="form-error">{errors.email.message}</span>
                                )}
                            </div>

                            {/* Campo Senha */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end">
                                    <label className="form-label" style={{ marginBottom: 0 }}>
                                        Senha
                                    </label>
                                    <button type="button"
                                        className="text-[11px] font-semibold transition-colors"
                                        style={{ color: '#7c3aed' }}>
                                        Esqueceu a senha?
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock size={16} style={{ color: '#9ca3af' }} />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                                        style={{ color: '#9ca3af' }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="form-error">{errors.password.message}</span>
                                )}
                            </div>

                            {/* Mensagem de erro da API */}
                            {error && (
                                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                                    style={{
                                        background: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        color: '#991b1b',
                                    }}>
                                    {error}
                                </div>
                            )}

                            {/* Botão Entrar */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #b48c26, #d4af37)',
                                    color: '#3d2800',
                                    boxShadow: '0 4px 16px rgba(180,140,38,0.3)',
                                }}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                                        style={{ borderColor: 'rgba(61,40,0,0.25)', borderTopColor: '#3d2800' }} />
                                ) : (
                                    'Entrar no Sistema'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Rodapé */}
                <div className="flex flex-col items-center gap-3 mt-8">
                    <div className="flex items-center gap-3" style={{ color: '#d1d5db' }}>
                        <div className="h-px w-6" style={{ background: 'currentColor' }} />
                        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                            Acesso restrito a parceiros
                        </p>
                        <div className="h-px w-6" style={{ background: 'currentColor' }} />
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>
                        © {new Date().getFullYear()} Bella Beauty · Todos os direitos reservados
                    </p>
                </div>
            </div>
        </div>
    );
}
