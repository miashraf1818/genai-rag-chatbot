'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');

    useEffect(() => {
        // Load theme from localStorage on mount
        const stored = localStorage.getItem('genai-theme') as Theme;
        if (stored === 'light' || stored === 'dark') {
            setThemeState(stored);
            applyTheme(stored);
        } else {
            // Default to dark
            applyTheme('dark');
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('genai-theme', newTheme);
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
