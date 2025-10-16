import { useState, useEffect } from 'react';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
}

export function validateJwt(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }

    try {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;
        if (typeof exp !== 'number') {
            return false;
        }
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime < exp;

    }
    catch {
        return false;
    }
}

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            if (token && userData) {
                console.log('useAuth checkAuth - found token and user data, setting authenticated');
                setIsAuthenticated(true);
                setUser(JSON.parse(userData));
            } else {
                console.log('useAuth checkAuth - no token or user data, setting not authenticated');
                setIsAuthenticated(false);
                setUser(null);
            }
        };

        // Check auth on mount
        checkAuth();

        // Listen for storage changes (when login/logout happens in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' || e.key === 'user') {
                checkAuth();
            }
        };

        // Listen for same-tab auth changes via a custom event
        const handleAuthChanged = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-changed' as any, handleAuthChanged as any);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-changed' as any, handleAuthChanged as any);
        };
    }, []);

    const login = (email: string, _password: string) => {
        // Simulate login - in real app, this would call API
        const userData: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            phone: '0123456789'
        };
        
        const token = 'demo_token_' + Date.now();
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state immediately
        console.log('useAuth login - setting isAuthenticated to true, user:', userData);
        setIsAuthenticated(true);
        setUser(userData);
        // Notify same-tab listeners
        window.dispatchEvent(new Event('auth-changed'));
        
        return true;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Update state immediately
        setIsAuthenticated(false);
        setUser(null);
        // Notify same-tab listeners
        window.dispatchEvent(new Event('auth-changed'));
    };

    return {
        isAuthenticated,
        user,
        login,
        logout
    };
}

