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

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
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
            setError(err.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative font-sans">
            
            {/* Background 3D Abstract Immersive */}
            <div className="absolute inset-0 z-0 bg-[#02407d]">
                <img 
                    src="/cyan_abstract_bg_1775353354617.png" 
                    alt="Abstract BG" 
                    className="w-full h-full object-cover opacity-90 scale-110"
                />
                {/* Vibrant Blue Overlay to match the reference's brightness */}
                <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[1px]" />
            </div>

            <div className="relative z-10 w-full max-w-[450px] flex flex-col items-center">
                
                {/* Logo Title (Centered like reference) */}
                <h1 className="text-white text-xl font-bold mb-10 tracking-tight font-sans">Your logo</h1>

                {/* The Login Card - Perfect Glassmorphism */}
                <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] p-10 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                    
                    <h2 className="text-white text-[28px] font-bold mb-8 font-sans">Login</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        
                        {/* Email Input Field */}
                        <div className="space-y-2">
                            <label className="text-[13px] text-white/90 ml-1 font-medium font-sans">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="username@gmail.com"
                                className="!bg-white !text-black !w-full !py-3.5 !px-5 !rounded-lg !text-[15px] !outline-none focus:!ring-2 focus:!ring-blue-400 !border-none !shadow-none !h-auto font-sans placeholder:text-gray-300"
                            />
                            {errors.email && (
                                <p className="text-[11px] text-red-300 font-bold ml-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Input Field */}
                        <div className="space-y-2">
                            <label className="text-[13px] text-white/90 ml-1 font-medium font-sans">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Password"
                                    className="!bg-white !text-black !w-full !py-3.5 !px-5 !rounded-lg !text-[15px] !outline-none focus:!ring-2 focus:!ring-blue-400 !border-none !shadow-none !h-auto font-sans placeholder:text-gray-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] text-red-300 font-bold ml-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Forgot Link */}
                        <div className="text-left py-1">
                            <button type="button" className="text-[13px] text-white/70 hover:text-white transition-colors underline-offset-4 hover:underline font-sans">
                                Forgot Password?
                            </button>
                        </div>

                        {error && (
                            <div className="text-red-200 text-[11px] font-bold text-center bg-red-900/30 p-2 rounded-lg py-3">
                                {error}
                            </div>
                        )}

                        {/* Sign In Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="!w-full !py-4 !bg-[#0b283d] hover:!bg-[#071b29] !text-white !rounded-xl !font-bold !text-sm !transition-all !border-none !shadow-none !h-auto font-sans disabled:opacity-50"
                            >
                                {loading ? 'Sign in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    {/* Separator */}
                    <div className="relative flex items-center justify-center my-8">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-white/30 text-[11px] font-medium font-sans">or continue with</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    {/* Social Buttons (Grid 3 like ref + icons) */}
                    <div className="grid grid-cols-3 gap-4">
                        <button type="button" className="flex items-center justify-center py-3 bg-white hover:bg-gray-100 rounded-xl transition-all shadow-sm">
                            <GoogleIcon />
                        </button>
                        <button type="button" className="flex items-center justify-center py-3 bg-white hover:bg-gray-100 rounded-xl transition-all shadow-sm">
                            <GitHubIcon />
                        </button>
                        <button type="button" className="flex items-center justify-center py-3 bg-white hover:bg-gray-100 rounded-xl transition-all shadow-sm">
                            <FacebookIcon />
                        </button>
                    </div>

                    {/* Footer Register link */}
                    <div className="mt-10 text-center">
                        <p className="text-[12px] text-white/50 font-sans">
                            Don't have an account yet? <button className="font-bold text-white hover:text-white/80 transition-colors">Register for free</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
