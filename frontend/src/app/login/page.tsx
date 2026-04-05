'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff, Scissors } from 'lucide-react';

const schema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(4, 'Senha muito curta'),
});
type LoginForm = z.infer<typeof schema>;

// ── SVG Icons ──────────────────────────────────────────
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
);

export default function LoginPage() {
    const router  = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [showPass, setShowPass] = useState(false);
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            setLoading(true); setError('');
            const res = await api.post('/auth/login', data);
            const { accessToken, user } = res.data;
            setAuth(user, accessToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciais inválidas.');
        } finally { setLoading(false); }
    };

    // ── Inline styles (override globals.css completely) ──
    const s = {
        wrap: {
            minHeight: '100vh',
            display:   'flex',
            alignItems:'center',
            justifyContent:'center',
            background:'#000000',
            position:  'relative' as const,
            overflow:  'hidden',
            fontFamily:"'Inter', system-ui, sans-serif",
        },
        bgImg: {
            position:  'absolute' as const,
            inset: 0,
            width: '100%',
            height:'100%',
            objectFit:'cover' as const,
            opacity: 0.85,
        },
        bgOverlay: {
            position:'absolute' as const,
            inset: 0,
            background:'linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(0,20,20,0.35) 100%)',
        },
        outer: {
            position:'relative' as const,
            zIndex: 10,
            width:   '100%',
            maxWidth:'420px',
            padding: '0 16px',
            display: 'flex',
            flexDirection:'column' as const,
            alignItems:'center',
        },
        brandRow: {
            display:'flex',
            alignItems:'center',
            gap:'10px',
            marginBottom:'24px',
        },
        brandIcon: {
            width: '38px',
            height:'38px',
            background:'rgba(0,229,255,0.15)',
            border:   '1.5px solid rgba(0,229,255,0.4)',
            borderRadius:'10px',
            display:  'flex',
            alignItems:'center',
            justifyContent:'center',
            backdropFilter:'blur(8px)',
        },
        brandName: {
            color:'#ffffff',
            fontSize:'18px',
            fontWeight:700,
            letterSpacing:'-0.3px',
            margin:0,
        },
        card: {
            width:    '100%',
            background:'rgba(255,255,255,0.08)',
            backdropFilter:'blur(28px)',
            WebkitBackdropFilter:'blur(28px)',
            border:   '1px solid rgba(255,255,255,0.15)',
            borderRadius:'28px',
            padding:  '36px 32px',
            boxShadow:'0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
        },
        cardTitle: {
            color:       '#ffffff',
            fontSize:    '26px',
            fontWeight:   700,
            margin:      '0 0 28px 0',
            letterSpacing:'-0.5px',
            fontFamily:  "'Inter', sans-serif",
        },
        label: {
            display:    'block',
            color:      'rgba(255,255,255,0.7)',
            fontSize:   '12px',
            fontWeight:  500,
            marginBottom:'6px',
            letterSpacing:'0.02em',
        },
        input: {
            display:    'block',
            width:      '100%',
            boxSizing:  'border-box' as const,
            background: '#ffffff',
            border:     'none',
            borderRadius:'10px',
            padding:    '12px 16px',
            fontSize:   '14px',
            fontWeight:  400,
            color:      '#1a1a1a',
            outline:    'none',
            fontFamily: "'Inter', sans-serif",
            height:     'auto',
            lineHeight: '1.5',
        },
        inputWrap: {
            position:'relative' as const,
        },
        eyeBtn: {
            position:  'absolute' as const,
            right:     '12px',
            top:       '50%',
            transform: 'translateY(-50%)',
            background:'none',
            border:    'none',
            cursor:    'pointer',
            padding:   '4px',
            color:     '#aaa',
            display:   'flex',
            alignItems:'center',
        },
        forgotBtn: {
            background:'none',
            border:    'none',
            cursor:    'pointer',
            color:     'rgba(0,229,255,0.8)',
            fontSize:  '12px',
            fontWeight: 500,
            padding:   '0',
            fontFamily:"'Inter', sans-serif",
        },
        errBox: {
            background:'rgba(239,68,68,0.15)',
            border:    '1px solid rgba(239,68,68,0.3)',
            borderRadius:'8px',
            padding:   '10px 14px',
            color:     '#fca5a5',
            fontSize:  '12px',
            fontWeight: 600,
            textAlign: 'center' as const,
        },
        submitBtn: {
            display:    'block',
            width:      '100%',
            boxSizing:  'border-box' as const,
            background: '#0a1628',
            color:      '#ffffff',
            border:     '1px solid rgba(0,229,255,0.2)',
            borderRadius:'10px',
            padding:    '14px',
            fontSize:   '14px',
            fontWeight:  700,
            cursor:     'pointer',
            fontFamily: "'Inter', sans-serif",
            transition: 'background 0.2s',
            letterSpacing:'0.02em',
        },
        dividerWrap: {
            display:'flex',
            alignItems:'center',
            gap:'12px',
            margin:'24px 0',
        },
        dividerLine: {
            flex:1,
            height:'1px',
            background:'rgba(255,255,255,0.1)',
        },
        dividerText: {
            color:    'rgba(255,255,255,0.35)',
            fontSize: '11px',
            whiteSpace:'nowrap' as const,
        },
        socialGrid: {
            display:'grid',
            gridTemplateColumns:'repeat(3, 1fr)',
            gap:'10px',
        },
        socialBtn: {
            background:   '#ffffff',
            border:       'none',
            borderRadius: '10px',
            padding:      '11px',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            transition:   'opacity 0.2s',
        },
        footerText: {
            color:     'rgba(255,255,255,0.4)',
            fontSize:  '11px',
            textAlign: 'center' as const,
            marginTop: '24px',
        },
        footerLink: {
            background:'none',
            border:    'none',
            cursor:    'pointer',
            color:     '#ffffff',
            fontWeight: 700,
            fontSize:  '11px',
            fontFamily:"'Inter', sans-serif",
        },
        fieldErr: {
            color:     '#fca5a5',
            fontSize:  '11px',
            fontWeight: 600,
            marginTop: '4px',
            display:   'block',
        },
    };

    return (
        <div style={s.wrap}>
            {/* Background */}
            <img src="/beauty_bg_login.png" alt="" style={s.bgImg} />
            <div style={s.bgOverlay} />

            {/* Main Content */}
            <div style={s.outer}>
                {/* Brand row */}
                <div style={s.brandRow}>
                    <div style={s.brandIcon}>
                        <Scissors size={18} color="#00e5ff" strokeWidth={1.8} />
                    </div>
                    <p style={s.brandName}>Bella Beauty</p>
                </div>

                {/* Card */}
                <div style={s.card}>
                    <h2 style={s.cardTitle}>Login</h2>

                    <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

                        {/* Email */}
                        <div>
                            <label style={s.label}>Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="username@gmail.com"
                                style={s.input}
                            />
                            {errors.email && <span style={s.fieldErr}>{errors.email.message}</span>}
                        </div>

                        {/* Password */}
                        <div>
                            <label style={s.label}>Password</label>
                            <div style={s.inputWrap}>
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Password"
                                    style={{ ...s.input, paddingRight:'42px' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <span style={s.fieldErr}>{errors.password.message}</span>}
                        </div>

                        {/* Forgot */}
                        <div style={{ textAlign:'left', marginTop:'-6px' }}>
                            <button type="button" style={s.forgotBtn}>Forgot Password?</button>
                        </div>

                        {/* Error */}
                        {error && <div style={s.errBox}>{error}</div>}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }}
                        >
                            {loading
                                ? 'Signing in...'
                                : 'Sign in'
                            }
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={s.dividerWrap}>
                        <div style={s.dividerLine} />
                        <span style={s.dividerText}>or continue with</span>
                        <div style={s.dividerLine} />
                    </div>

                    {/* Social */}
                    <div style={s.socialGrid}>
                        <button type="button" style={s.socialBtn}><GoogleIcon /></button>
                        <button type="button" style={s.socialBtn}><GitHubIcon /></button>
                        <button type="button" style={s.socialBtn}><FacebookIcon /></button>
                    </div>

                    {/* Footer */}
                    <p style={s.footerText}>
                        Don't have an account yet?{' '}
                        <button type="button" style={s.footerLink}>Register for free</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
