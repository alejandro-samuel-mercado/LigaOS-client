/**
 * Login page with email/password form and Google OAuth button.
 * Validates input with Zod before submission.
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Trophy, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LABELS } from '@/content/labels';
import { getErrorMessage } from '@/content/errors';
import { z } from 'zod';
import { setAccessToken } from '@/adapters/http';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
});

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, checkAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken) {
            setAccessToken(accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            // If we are in a popup, tell the opener and close
            if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', accessToken, refreshToken }, window.location.origin);
                window.close();
            } else {
                // Direct redirect
                checkAuth().then(() => router.push('/'));
            }
        }

        // Listen for messages from popup
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                setGoogleLoading(true);
                if (event.data.accessToken) setAccessToken(event.data.accessToken);
                if (event.data.refreshToken) localStorage.setItem('refreshToken', event.data.refreshToken);
                checkAuth().finally(() => {
                    setGoogleLoading(false);
                    router.push('/');
                });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [searchParams, router, checkAuth]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                errors[issue.path[0] as string] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password);
            router.push('/');
        } catch (err: unknown) {
            const error = err as { code?: string };
            setError(getErrorMessage(error.code ?? 'INTERNAL_ERROR'));
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleGoogleLogin() {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/google`,
            'google-login',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    }

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-black mesh-bg px-4 py-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#082032] border-2 border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary" />

                {/* Logo */}
                <div className="mb-12 flex flex-col items-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center border-4 border-black bg-white shadow-lg -rotate-3 group-hover:rotate-0 transition-transform">
                        <Trophy size={40} className="text-black" strokeWidth={3} />
                    </div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        LIGA<span className="text-accent-primary">PRO</span>
                    </h1>
                    <p className="mt-2 text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Elite Sports Management</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border-l-4 border-red-600 bg-red-600/10 px-6 py-4 text-xs font-black uppercase text-red-500 tracking-widest"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary group-focus-within:scale-110 transition-transform" />
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={LABELS.auth.email}
                                className="w-full border-2 border-black bg-white/5 py-4 pl-12 pr-4 text-sm font-bold text-white placeholder-white/10 outline-none transition-all focus:border-accent-primary focus:bg-white/10"
                            />
                        </div>
                        {fieldErrors['email'] && (
                            <p className="mt-1 text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['email']}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Password</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary group-focus-within:scale-110 transition-transform" />
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={LABELS.auth.password}
                                className="w-full border-2 border-black bg-white/5 py-4 pl-12 pr-12 text-sm font-bold text-white placeholder-white/10 outline-none transition-all focus:border-accent-primary focus:bg-white/10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {fieldErrors['password'] && (
                            <p className="mt-1 text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['password']}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        id="login-submit"
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-accent-primary active:translate-y-1 border-b-4 border-accent-primary disabled:opacity-50"
                    >
                        {isSubmitting ? 'CARGANDO...' : 'INGRESAR AL SISTEMA'}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-4">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-black uppercase text-white/20">O</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    {/* Google */}
                    <button
                        id="google-login"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting || googleLoading}
                        className="flex w-full items-center justify-center gap-3 border-2 border-black bg-white/5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-50"
                    >
                        {googleLoading ? (
                            'CARGANDO...'
                        ) : (
                            <>
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                GOOGLE AUTHENTICATION
                            </>
                        )}
                    </button>
                </form>

                {/* Register link */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        ¿No tienes cuenta?{' '}
                        <Link href="/register" className="text-accent-primary hover:underline">
                            REGÍSTRATE AHORA
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-accent-primary" size={48} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
