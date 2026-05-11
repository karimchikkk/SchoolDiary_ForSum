import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
    token: string;
    userId: number; // Важно: используем userId, как в ответе бэкенда
    role: number;   // 0=student, 1=teacher, 2=admin
    fullName: string;
    classId?: number; // Будет приходить с бэкенда
    className?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    login: (user: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem('auth_user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error("Auth initialization error:", e);
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
            localStorage.setItem('token', user.token);
        } else {
            localStorage.removeItem('auth_user');
            localStorage.removeItem('token');
            localStorage.removeItem('user'); // Чистим старые ключи
        }
    }, [user]);

    const login = (u: AuthUser) => {
        console.log("Вход выполнен. Данные пользователя:", u);
        setUser(u);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}