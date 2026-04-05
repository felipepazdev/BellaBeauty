'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Scissors } from 'lucide-react';
import Image from 'next/image';

const schema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(4, 'Senha muito curta'),
});

type LoginForm = z.infer<typeof schema>;

// SVG Icons for social login
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
            setError(err.response?.data?.message || 'Credenciais inválidas. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A]">
            
            {/* Background Image / Abstract Shapes */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/cyan_abstract_bg_1775353354617.png" 
                    alt="Abstract Background" 
                    className="w-full h-full object-cover"
                />
                {/* Fallback solid gradient overlay just in case image is missing */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-black/60 to-black/80 mix-blend-overlay" />
            </div>

            {/* Inner Glass Container Box (similar to the dark semi-transparent wider box in reference) */}
            <div className="relative z-10 w-full max-w-5xl h-[80vh] min-h-[600px] flex items-center justify-center my-6">
                
                {/* The Login Card */}
                <div className="w-full max-w-[400px] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 shadow-2xl relative">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8 text-center pt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-cyan-500 rounded-lg text-black">
                                <Scissors size={20} strokeWidth={2} />
                            </div>
                            <span className="text-xl font-bold text-white tracking-wide">Bella Beauty</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Login</h2>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        
                        {/* E-mail */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] text-white/80 ml-1">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="username@gmail.com"
                                className="w-full bg-white text-black py-3 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-gray-400 font-medium"
                            />
                            {errors.email && (
                                <p className="text-[11px] font-semibold text-red-400 ml-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] text-white/80 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Password"
                                    className="w-full bg-white text-black py-3 px-4 pr-10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-gray-400 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] font-semibold text-red-400 ml-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-start">
                            <button type="button" className="text-[12px] text-cyan-300 hover:text-cyan-200 transition-colors ml-1">
                                Forgot Password?
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/20 text-red-200 border border-red-500/50 text-xs py-2.5 px-3 rounded-lg font-medium text-center">
                                {error}
                            </div>
                        )}

                        {/* Sign In Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Social Login Options */}
                    <div className="mt-8">
                        <div className="relative flex items-center mb-6">
                            <div className="flex-grow border-t border-white/20"></div>
                            <span className="flex-shrink-0 mx-4 text-white/50 text-[11px]">or continue with</span>
                            <div className="flex-grow border-t border-white/20"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" className="flex items-center justify-center py-2.5 bg-white hover:bg-gray-50 rounded-xl transition-colors shadow-sm">
                                <GoogleIcon />
                            </button>
                            <button type="button" className="flex items-center justify-center py-2.5 bg-white hover:bg-gray-50 rounded-xl transition-colors shadow-sm">
                                <FacebookIcon />
                            </button>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <p className="text-[11px] text-white/70">
                            Don't have an account yet? <button className="font-bold text-white hover:text-cyan-300 transition-colors">Register for free</button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
