'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, Save, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';


export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';  // Redirect to homepage
            return;
        }

        loadProfile(token);
    }, []);

    const loadProfile = async (token: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/profile/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setFullName(data.full_name || '');
                setBio(data.bio || '');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: fullName,
                    bio: bio
                })
            });

            if (response.ok) {
                setMessage('Profile updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        setMessage('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (response.ok) {
                setMessage('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const data = await response.json();
                setMessage(data.detail || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage('Error changing password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="glass border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/chat" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-600 dark:text-slate-400">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Success Message */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl ${message.includes('successfully')
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                            }`}
                    >
                        {message}
                    </motion.div>
                )}

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800"
                >
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Profile Information</h2>

                    {/* User Info Header (No Avatar Upload) */}
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{user.username}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2 font-medium"
                            >
                                <Save className="w-5 h-5" />
                                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Account Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800"
                >
                    <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Account Details</h2>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Email</p>
                                <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Username</p>
                                <p className="font-medium text-slate-900 dark:text-white">{user.username}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Member Since</p>
                                <p className="font-medium text-slate-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Password Change Card */}
                {!user.google_id && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Change Password</h2>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2 font-medium"
                                >
                                    <Lock className="w-5 h-5" />
                                    <span>{isChangingPassword ? 'Changing...' : 'Change Password'}</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
