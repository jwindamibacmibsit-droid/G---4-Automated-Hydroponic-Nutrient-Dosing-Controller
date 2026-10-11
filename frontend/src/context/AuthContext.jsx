
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const checkSession = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/auth/session`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.authenticated) {
                setUser(null);
                return null;
            }

            setUser(data.user);
            return data.user;
        } catch (error) {
            console.error("SESSION CHECK ERROR:", error);
            setUser(null);
            return null;
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/auth/logout`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Server logout failed.");
            }

            setUser(null);
        } catch (error) {
            console.error("LOGOUT ERROR:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                authLoading,
                login,
                logout,
                checkSession
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}
