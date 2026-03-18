'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Scissors, Lock, Mail } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.12) 0%, #0f0f13 60%)' }}>

            <div className="w-full max-w-[420px] animate-fade-in">

                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}>
                        <Scissors size={28} color="#fff" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Bella Beauty</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Gestão inteligente para seu salão
                    </p>
                </div>

                {/* Card do form */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-6">Entrar na conta</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

                        {/* Email */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }} />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="input-field pl-9"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <span className="text-xs" style={{ color: 'var(--danger)' }}>{errors.email.message}</span>
                            )}
                        </div>

                        {/* Senha */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Senha
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }} />
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input-field pl-9 pr-10"
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password.message}</span>
                            )}
                        </div>

                        {/* Erro API */}
                        {error && (
                            <div className="rounded-lg px-4 py-3 text-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
                            {loading ? <span className="spinner" /> : null}
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                    © {new Date().getFullYear()} Bella Beauty · Todos os direitos reservados
                </p>
            </div>
        </div>
    );
}
