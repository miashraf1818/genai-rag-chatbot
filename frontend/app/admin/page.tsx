'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, MessageSquare, Activity, Shield, ArrowLeft, Sparkles, TrendingUp, Ban } from 'lucide-react';
import Link from 'next/link';

interface Stats {
    total_users: number;
    active_users_7d: number;
    active_users_30d: number;
    total_chats: number;
    total_chats_today: number;
    blocked_users: number;
}

interface User {
    id: number;
    email: string;
    username: string;
    is_admin: boolean;
    is_active: boolean;
    created_at: string;
    last_login: string | null;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            window.location.href = '/auth/login';
            return;
        }

        if (userData) {
            const user = JSON.parse(userData);
            setCurrentUser(user);

            if (!user.is_admin) {
                window.location.href = '/chat';
                return;
            }
        }

        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');

        try {
            // Fetch stats
            const statsRes = await fetch('http://localhost:8000/api/admin/stats/overview', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsRes.json();
            setStats(statsData);

            // Fetch users
            const usersRes = await fetch('http://localhost:8000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                // Backend returns { users: [...], total: ... }
                setUsers(usersData.users || []);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserStatus = async (userId: number, isActive: boolean) => {
        const token = localStorage.getItem('token');

        try {
            await fetch(`http://localhost:8000/api/admin/users/${userId}/${isActive ? 'block' : 'unblock'}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Refresh users
            fetchDashboardData();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center">
                <div className="flex space-x-2">
                    <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-4 h-4 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950">
            {/* Header */}
            <header className="glass border-b border-white/20 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/chat" className="p-2 hover:bg-white/50 dark:hover:bg-slate-900/50 rounded-lg transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Shield className="w-8 h-8 text-purple-600" />
                            <span className="text-2xl font-bold gradient-text">Admin Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {currentUser?.username}
                            </p>
                            <p className="text-xs text-slate-500">Administrator</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {currentUser?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Total Users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-green-600 text-sm font-semibold flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +12%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {stats?.total_users || 0}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Total Users</p>
                    </motion.div>

                    {/* Active Users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-green-600 text-sm font-semibold flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +8%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {stats?.active_users_7d || 0}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Active Users (7 days)</p>
                    </motion.div>

                    {/* Total Chats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-green-600 text-sm font-semibold flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +24%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {stats?.total_chats || 0}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Total Conversations</p>
                    </motion.div>

                    {/* Chats Today */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {stats?.total_chats_today || 0}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Chats Today</p>
                    </motion.div>

                    {/* 30-Day Active */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {stats?.active_users_30d || 0}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Active Users (30 days)</p>
                    </motion.div>

                    {/* Blocked Users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                                <Ban className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {stats?.blocked_users || 0}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Blocked Users</p>
                    </motion.div>
                </div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass rounded-2xl p-8"
                >
                    <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                        User Management
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        User
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        Email
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        Role
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        Status
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        Last Login
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-white/30 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {user.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {user.email}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${user.is_admin
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {user.is_admin ? 'Admin' : 'User'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${user.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {user.last_login
                                                ? new Date(user.last_login).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                        <td className="px-4 py-4">
                                            {user.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${user.is_active
                                                        ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                                        : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                                        }`}
                                                >
                                                    {user.is_active ? 'Block' : 'Unblock'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
