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

        if (token && savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setUser(user);
                setIsAuthenticated(true);

                // CRITICAL: Ensure the axios instance is aware of this token immediately
                // This prevents race conditions where the first API call fails before the interceptor can react
                import("../api/auth.api").then(({ api }) => {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                });
            } catch (e) {
                console.error("AuthContext: Failed to parse saved user", e);
                logout();
            }
        }
        setIsLoading(false);

        // Listen for auth changes in other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "access_token" || e.key === "user") {
                console.log("AuthContext: Storage change detected", e.key);
                const newToken = localStorage.getItem("access_token");
                const newUser = localStorage.getItem("user");

                if (!newToken || !newUser) {
                    // User logged out in another tab
                    console.log("AuthContext: User logged out in another tab");
                    setUser(null);
                    setIsAuthenticated(false);
                } else {
                    try {
                        const newUserData = JSON.parse(newUser);
                        console.log("AuthContext: User changed in another tab", newUserData.role);

                        // Check if this is a different user than current
                        if (user && newUserData.id !== user.id) {
                            console.log("AuthContext: Different user logged in another tab - updating session");
                            // Show a brief notification to user about the session change
                            const notification = document.createElement('div');
                            notification.style.cssText = `
                                position: fixed;
                                top: 20px;
                                right: 20px;
                                background: #3b82f6;
                                color: white;
                                padding: 12px 16px;
                                border-radius: 8px;
                                font-size: 14px;
                                font-weight: 500;
                                z-index: 9999;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                                max-width: 300px;
                            `;
                            notification.textContent = `Switched to ${newUserData.role} session from another tab`;
                            document.body.appendChild(notification);

                            // Remove notification after 3 seconds
                            setTimeout(() => {
                                if (notification.parentNode) {
                                    notification.parentNode.removeChild(notification);
                                }
                            }, 3000);
                        }

                        setUser(newUserData);
                        setIsAuthenticated(true);

                        // Update axios headers for the new session
                        import("../api/auth.api").then(({ api }) => {
                            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                        });
                    } catch (err) {
                        console.error("AuthContext: Failed to parse user from storage event", err);
                        logout();
                    }
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const login = (access: string, refresh: string, userData: User) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);

        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            const { logoutUser } = await import("../api/auth.api");
            await logoutUser();
        } catch (err) {
            console.error("AuthContext: Server logout failed", err);
        }

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
