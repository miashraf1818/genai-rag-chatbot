'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Send, Menu, LogOut, Upload, Sparkles, User, Trash2, Edit2, MessageSquare, Check, Copy, X } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';


interface Message {
    id: number;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
    last_message: string | null;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [editingConvId, setEditingConvId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            window.location.href = '/';  // Redirect to homepage
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Load conversations
        loadConversations(token);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async (token: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/conversations/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadConversation = async (conversationId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/conversations/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const loadedMessages = data.messages.flatMap((msg: any) => [
                    {
                        id: msg.id * 2,
                        text: msg.question,
                        isUser: true,
                        timestamp: new Date(msg.timestamp)
                    },
                    {
                        id: msg.id * 2 + 1,
                        text: msg.answer,
                        isUser: false,
                        timestamp: new Date(msg.timestamp)
                    }
                ]);
                setMessages(loadedMessages);
                setCurrentConversationId(conversationId);
                if (isMobile) setIsSidebarOpen(false);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const createNewConversation = async () => {
        setMessages([]);
        setCurrentConversationId(null);
        setInput('');
        if (isMobile) setIsSidebarOpen(false);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            text: input,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: currentInput,
                    conversation_id: currentConversationId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            // Update conversation ID if it's a new conversation
            if (!currentConversationId && data.conversation_id) {
                setCurrentConversationId(data.conversation_id);
                // Reload conversations to show the new one
                loadConversations(token!);
            }

            const botMessage: Message = {
                id: Date.now() + 1,
                text: data.answer,
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage: Message = {
                id: Date.now() + 1,
                text: 'Sorry, I encountered an error. Please try again.',
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingConversation = (conv: Conversation) => {
        setEditingConvId(conv.id);
        setEditingTitle(conv.title);
    };

    const saveConversationTitle = async (convId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/conversations/${convId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: editingTitle })
            });

            if (response.ok) {
                setConversations(prev => prev.map(c =>
                    c.id === convId ? { ...c, title: editingTitle } : c
                ));
                setEditingConvId(null);
            }
        } catch (error) {
            console.error('Error updating conversation:', error);
        }
    };

    const deleteConversation = async (convId: string) => {
        if (!confirm('Delete this conversation?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/conversations/${convId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setConversations(prev => prev.filter(c => c.id !== convId));
                if (currentConversationId === convId) {
                    createNewConversation();
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const CopyButton = ({ text }: { text: string }) => {
        const [isCopied, setIsCopied] = useState(false);

        const handleCopy = async () => {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        return (
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Copy code"
            >
                {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            </button>
        );
    };

    const SidebarContent = () => (
        <>
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/chat" className="flex items-center space-x-2">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        <span className="text-2xl font-bold gradient-text">GenAI Chat</span>
                    </Link>
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    )}
                </div>

                <button
                    onClick={createNewConversation}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    <Sparkles className="w-5 h-5" />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wider">
                    Recent Chats
                </h3>
                {conversations.length > 0 ? (
                    <div className="space-y-1">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group relative flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl transition-all ${currentConversationId === conv.id
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                {editingConvId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={() => saveConversationTitle(conv.id)}
                                        onKeyPress={(e) => e.key === 'Enter' && saveConversationTitle(conv.id)}
                                        className="flex-1 bg-transparent border-b border-purple-500 focus:outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <button
                                        onClick={() => loadConversation(conv.id)}
                                        className="flex-1 text-left truncate"
                                    >
                                        <MessageSquare className={`w-4 h-4 inline mr-2 ${currentConversationId === conv.id ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                                        {conv.title}
                                    </button>
                                )}

                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <button
                                        onClick={() => startEditingConversation(conv)}
                                        className="p-1 hover:bg-blue-500/10 text-blue-500 rounded"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => deleteConversation(conv.id)}
                                        className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-xs text-slate-400">No conversations yet</p>
                    </div>
                )}
            </div>

            {/* User Info */}
            <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800/50">
                <div className="flex items-center space-x-3 mb-4 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {user?.username || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {user?.email || ''}
                        </p>
                    </div>
                </div>

                <div className="space-y-1">
                    <Link
                        href="/profile"
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                    </Link>

                    <Link
                        href="/upload"
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Files</span>
                    </Link>

                    {user?.is_admin && (
                        <Link
                            href="/admin"
                            className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300"
                        >
                            <User className="w-4 h-4" />
                            <span>Admin Panel</span>
                        </Link>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center space-x-2 text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                    className="glass border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden whitespace-nowrap"
                >
                    <SidebarContent />
                </motion.aside>
            )}

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-slate-900/50">
                {/* Header */}
                <header className="glass border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                        >
                            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                            {currentConversationId
                                ? conversations.find(c => c.id === currentConversationId)?.title || 'Chat'
                                : 'New Chat'
                            }
                        </h1>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button
                            onClick={createNewConversation}
                            className="hidden sm:flex px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors items-center space-x-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>New Chat</span>
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-8">
                            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Welcome to GenAI Chat
                            </h2>
                            <p className="max-w-md mx-auto text-slate-600 dark:text-slate-400">
                                Start a new conversation to explore your documents. I can help you analyze, summarize, and answer questions.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[90%] sm:max-w-3xl px-5 py-4 rounded-2xl shadow-sm ${message.isUser
                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                                    }`}
                            >
                                {message.isUser ? (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none prose-sm sm:prose-base">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700/50">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700/50">
                                                                <span className="text-xs text-slate-400 font-mono">{match[1]}</span>
                                                                <CopyButton text={String(children).replace(/\n$/, '')} />
                                                            </div>
                                                            <SyntaxHighlighter
                                                                style={atomDark}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                customStyle={{
                                                                    margin: 0,
                                                                    borderRadius: '0',
                                                                    background: '#1e293b',
                                                                    padding: '1.5rem',
                                                                }}
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        </div>
                                                    ) : (
                                                        <code className={`${className} bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-400`} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                            }}
                                        >
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                <p className={`text-[10px] mt-2 ${message.isUser ? 'text-purple-100/70' : 'text-slate-400'}`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-2xl rounded-bl-none shadow-sm">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-4xl mx-auto relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message..."
                            className="w-full pl-6 pr-16 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-3">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
