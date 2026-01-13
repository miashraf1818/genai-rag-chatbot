'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle } from 'lucide-react';

export default function GoogleAuthSuccess() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Store token
            localStorage.setItem('token', token);

            // Fetch user info
            fetch('http://localhost:8000/api/profile/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(userData => {
                    localStorage.setItem('user', JSON.stringify(userData));
                    // Redirect to chat after a brief delay
                    setTimeout(() => {
                        window.location.href = '/chat';
                    }, 1500);
                })
                .catch(() => {
                    // If fetching user fails, still redirect but without user data
                    setTimeout(() => {
                        window.location.href = '/chat';
                    }, 1500);
                });
        } else {
            // No token, redirect to login
            window.location.href = '/auth/login';
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 dark:from-green-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <Sparkles className="w-24 h-24 text-green-600 animate-pulse" />
                        <CheckCircle className="absolute -bottom-2 -right-2 w-12 h-12 text-green-600" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-4">
                    <span className="gradient-text">Authentication Successful!</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400">
                    Redirecting you to your chat...
                </p>

                <div className="mt-8 flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </motion.div>
        </div>
    );
}
