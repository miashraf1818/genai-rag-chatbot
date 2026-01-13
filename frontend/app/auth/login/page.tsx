'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store token
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                // Redirect to chat
                window.location.href = '/chat';
            } else {
                alert(data.detail || 'Login failed');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse"></div>
                <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -bottom-20 -right-20 animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md z-10"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center space-x-2 mb-8 group">
                    <div className="p-3 bg-white/20 dark:bg-white/5 rounded-2xl backdrop-blur-xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-3xl font-bold gradient-text tracking-tight">GenAI Chat</span>
                </Link>

                {/* Login Card */}
                <div className="glass rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-white/10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                            Welcome Back
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Sign in to continue your conversations
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="ml-2">Remember me</span>
                            </label>
                            <Link href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-6 text-white font-semibold bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </span>
                            ) : 'Sign In'}
                        </button>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-4 bg-white/50 dark:bg-slate-900/50 text-slate-500 backdrop-blur-sm rounded-full">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        {/* Google Login */}
                        <button
                            type="button"
                            onClick={() => window.location.href = 'http://localhost:8000/auth/google/login'}
                            className="w-full py-3.5 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-center space-x-3 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Sign in with Google</span>
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold hover:underline transition-all">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
