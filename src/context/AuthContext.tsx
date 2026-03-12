import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types/auth.types";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (access: string, refresh: string, user: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for saved session
        const token = localStorage.getItem("access_token");
        const savedUser = localStorage.getItem("user");

        console.log("AuthContext: Checking for saved session...", { hasToken: !!token, hasUser: !!savedUser });

        if (token && savedUser) {
            try {
                const user = JSON.parse(savedUser);
                console.log("AuthContext: Restoring session for", user.email);
                setUser(user);
                setIsAuthenticated(true);
            } catch (e) {
                console.error("AuthContext: Failed to parse saved user", e);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (access: string, refresh: string, userData: User) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);

        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUserData = async (userData: Partial<User>) => {
        if (!user) return;

        try {
            const { updateUserProfile } = await import("../api/auth.api");
            const updatedUser = await updateUserProfile(user.id, userData);

            // Backend returns full user, so we merge it
            const newUserData = { ...user, ...updatedUser };
            setUser(newUserData);
            localStorage.setItem("user", JSON.stringify(newUserData));
        } catch (error) {
            console.error("Failed to update user profile on server:", error);
            // Fallback: update locally anyway if you want optimistic UI, 
            // but for settings, it's better to show error.
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                logout,
                updateUser: updateUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
