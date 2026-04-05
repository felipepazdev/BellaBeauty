'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff } from 'lucide-react';

const schema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(4, 'Senha muito curta'),
});

type LoginForm = z.infer<typeof schema>;

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

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
            setError(err.response?.data?.message || 'Credenciais inválidas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0a0a]">
            
            {/* Background Image Immersive */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/cyan_abstract_bg_1775353354617.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#001524]/60 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full max-w-[400px] animate-fade-in">
                
                {/* Your Logo (Reference Style) */}
                <div className="text-center mb-6">
                    <h1 className="text-white text-xl font-bold tracking-tight">Your logo</h1>
                </div>

                {/* Login Card - Ultra Glassmorphism */}
                <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[35px] p-10 shadow-2xl relative overflow-hidden">
                    
                    <div className="text-left mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/70 ml-1">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="username@gmail.com"
                                className="w-full bg-white py-3.5 px-5 rounded-2xl text-[14px] text-black outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-stone-300 font-medium"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 relative">
                            <label className="text-xs text-white/70 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Password"
                                    className="w-full bg-white py-3.5 px-5 rounded-2xl text-[14px] text-black outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-stone-300 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-black transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-start">
                            <button type="button" className="text-[12px] text-white/50 hover:text-white transition-colors ml-1">
                                Forgot Password?
                            </button>
                        </div>

                        {error && (
                            <div className="text-red-400 text-[11px] font-bold text-center bg-red-400/10 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Sign In Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#0a2333] hover:bg-[#113a53] text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-xl disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Or continue with */}
                    <div className="mt-8">
                        <div className="relative flex items-center mb-6">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-white/30 text-[10px]">or continue with</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center py-3 bg-white hover:bg-stone-50 rounded-2xl transition-all shadow-sm">
                                <GoogleIcon />
                            </button>
                            <button type="button" className="flex items-center justify-center py-4 bg-white hover:bg-stone-50 rounded-2xl transition-all shadow-sm translate-y-[-1px]">
                                <FacebookIcon />
                            </button>
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-8 text-center pt-2">
                        <p className="text-[11px] text-white/30">
                            Don't have an account yet? <button className="font-bold text-white/70 hover:text-white transition-colors">Register for free</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
