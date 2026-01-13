'use client';

import { motion } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    status: 'uploading' | 'success' | 'error';
    progress: number;
}

export default function UploadPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            window.location.href = '/';  // Redirect to homepage
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch previously uploaded files
        fetchUploadedFiles(token);
    }, []);

    const fetchUploadedFiles = async (token: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/files/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUploadedFiles(data.files || []);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            handleFiles(selectedFiles);
        }
    };

    const handleFiles = async (fileList: File[]) => {
        // Validate files before uploading
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        for (const file of fileList) {
            const fileExt = file.name.toLowerCase().split('.').pop();
            const allowedExts = ['pdf', 'txt', 'md', 'docx'];

            if (!fileExt || !allowedExts.includes(fileExt)) {
                invalidFiles.push(`${file.name} - Invalid type (only PDF, TXT, MD, DOCX allowed)`);
                continue;
            }

            // Check file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                invalidFiles.push(`${file.name} - Too large (max 10MB)`);
                continue;
            }

            validFiles.push(file);
        }

        // Show error for invalid files
        if (invalidFiles.length > 0) {
            alert('Some files were rejected:\n' + invalidFiles.join('\n'));
        }

        if (validFiles.length === 0) {
            return;
        }
        const newFiles: UploadedFile[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            status: 'uploading',
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Upload each file to backend
        for (const uploadedFile of newFiles) {
            const originalFile = validFiles.find(f => f.name === uploadedFile.name);
            if (!originalFile) continue;

            try {
                const formData = new FormData();
                formData.append('file', originalFile);

                const token = localStorage.getItem('token');

                // Start progress simulation
                const progressInterval = setInterval(() => {
                    setFiles(prev => prev.map(f =>
                        f.id === uploadedFile.id && f.progress < 90
                            ? { ...f, progress: Math.min(f.progress + 10, 90) }
                            : f
                    ));
                }, 200);

                // Actual API call
                const response = await fetch('http://localhost:8000/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                clearInterval(progressInterval);

                if (response.ok) {
                    const data = await response.json();
                    setFiles(prev => prev.map(f =>
                        f.id === uploadedFile.id
                            ? { ...f, status: 'success', progress: 100 }
                            : f
                    ));

                    // Show success message
                    console.log('Upload successful:', data);

                    // Show visible success notification (you might want to add a Toast component later)
                    alert(`Successfully uploaded ${uploadedFile.name}! Redirecting to chat...`);

                    // 🔄 AUTO-REDIRECT TO CHAT AFTER ALL FILES UPLOADED
                    setTimeout(() => {
                        const allSuccess = files.every(f => f.status === 'success' || f.id === uploadedFile.id);
                        if (allSuccess && fileList.length === newFiles.length) {
                            window.location.href = '/chat';
                        }
                    }, 1500);
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                setFiles(prev => prev.map(f =>
                    f.id === uploadedFile.id
                        ? { ...f, status: 'error' }
                        : f
                ));
            }
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950">
            {/* Header */}
            <header className="glass border-b border-white/20 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/chat" className="p-2 hover:bg-white/50 dark:hover:bg-slate-900/50 rounded-lg transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                            <span className="text-2xl font-bold gradient-text">File Upload</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Upload Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-12"
                >
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                            : 'border-slate-300 dark:border-slate-700'
                            }`}
                    >
                        <Upload className={`w-20 h-20 mx-auto mb-6 ${isDragging ? 'text-purple-600' : 'text-slate-400'}`} />

                        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                            Drop your files here
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            or click to browse from your computer
                        </p>

                        <input
                            type="file"
                            multiple
                            onChange={handleFileInput}
                            className="hidden"
                            id="file-input"
                            accept=".pdf,.doc,.docx,.txt,.md"
                        />
                        <label
                            htmlFor="file-input"
                            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            Select Files
                        </label>

                        <p className="text-sm text-slate-500 mt-6">
                            Supported formats: PDF, DOCX, TXT, MD (Max 10MB per file)
                        </p>
                    </div>
                </motion.div>

                {/* File List */}
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-3xl p-8"
                    >
                        <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                            Uploaded Files ({files.length})
                        </h3>

                        <div className="space-y-4">
                            {files.map((file) => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl"
                                >
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                            <File className="w-6 h-6 text-white" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {file.name}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {formatFileSize(file.size)}
                                        </p>

                                        {file.status === 'uploading' && (
                                            <div className="mt-2">
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{file.progress}%</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0">
                                        {file.status === 'success' && (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        )}
                                        {file.status === 'error' && (
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        )}
                                        {file.status === 'uploading' && (
                                            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="flex-shrink-0 p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Previously Uploaded Files */}
                {uploadedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-3xl p-8"
                    >
                        <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                            Your Documents ({uploadedFiles.length})
                        </h3>

                        <div className="space-y-3">
                            {uploadedFiles.map((file: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <File className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                                                {file.filename}
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                {formatFileSize(file.size)} • {new Date(file.uploaded_at * 1000).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass rounded-3xl p-8"
                >
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                        How It Works
                    </h3>
                    <div className="space-y-3 text-slate-600 dark:text-slate-400">
                        <p>📄 Upload your documents to create a knowledge base</p>
                        <p>🤖 AI processes and indexes your content automatically</p>
                        <p>💬 Ask questions and get answers from your documents</p>
                        <p>🔒 Your data is securely stored and encrypted</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
