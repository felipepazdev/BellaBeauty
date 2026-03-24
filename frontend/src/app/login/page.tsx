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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#060608]"
            style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)' }}>

            <div className="w-full max-w-[440px] animate-fade-in">

                {/* Logo */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6"
                        style={{ 
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))', 
                            boxShadow: '0 12px 40px rgba(139, 92, 246, 0.3)' 
                        }}>
                        <Scissors size={32} color="#fff" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">Bella Beauty</h1>
                    <p className="text-sm font-medium tracking-wide text-slate-400 uppercase">
                        Gestão de Beleza Premium
                    </p>
                </div>

                {/* Card do form */}
                <div className="card shadow-2xl backdrop-blur-xl">
                    <h2 className="text-xl font-serif font-semibold mb-8 text-center text-white/90">Acesse sua conta</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label className="form-label">E-mail Corporativo</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-[var(--accent)]"
                                    style={{ color: 'var(--text-muted)' }} />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                            {errors.email && (
                                <span className="form-error">{errors.email.message}</span>
                            )}
                        </div>

                        {/* Senha */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center pr-1">
                                <label className="form-label !mb-0">Sua Senha</label>
                                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-[#8b5cf6] hover:brightness-125 transition-all">Esqueceu?</button>
                            </div>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-[var(--accent)]"
                                    style={{ color: 'var(--text-muted)' }} />
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-white transition-colors"
                                    style={{ background: 'none', border: 'none' }}>
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="form-error">{errors.password.message}</span>
                            )}
                        </div>

                        {/* Erro API */}
                        {error && (
                            <div className="rounded-xl px-4 py-3 text-sm animate-shake bg-red-500/10 border border-red-500/20 text-red-400">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary mt-4 h-14 text-lg">
                            {loading ? <span className="spinner" /> : 'Entrar na Plataforma'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-10 tracking-widest text-slate-500 uppercase font-medium">
                    © {new Date().getFullYear()} Bella Beauty · Todos os direitos reservados
                </p>
            </div>
        </div>
    );
}
