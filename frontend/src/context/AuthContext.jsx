import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Session duration: 7 days in milliseconds
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);

    // Check session validity on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const loginTimestamp = localStorage.getItem("loginTimestamp");

        if (token && storedUser && loginTimestamp) {
            const elapsed = Date.now() - parseInt(loginTimestamp, 10);
            if (elapsed > SESSION_DURATION_MS) {
                // Session expired — clear everything and show message
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("loginTimestamp");
                setSessionExpiredMsg(true);
            } else {
                setUser(JSON.parse(storedUser));
            }
        } else if (token && storedUser) {
            // Legacy: no loginTimestamp yet — set it now (migración suave)
            localStorage.setItem("loginTimestamp", Date.now().toString());
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Setup axios interceptor: auto-logout on 401/403
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    // Check if user is currently logged in — if so, token has expired
                    const token = localStorage.getItem("token");
                    if (token) {
                        // Don't show expired message for auth-related endpoints (login, pending_approval, account_banned)
                        const msg = error.response.data?.message;
                        if (msg !== 'pending_approval' && msg !== 'account_banned') {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            localStorage.removeItem("loginTimestamp");
                            setUser(null);
                            setSessionExpiredMsg(true);
                        }
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const login = async (credentials) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
                email: credentials.email,
                password: credentials.password,
            });

            const { token, user } = res.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("loginTimestamp", Date.now().toString());
            setUser(user);
            setSessionExpiredMsg(false);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
                email: userData.email,
                password: userData.password,
                name: userData.name
            });

            // If the user registered successfully but is not yet approved
            if (res.data?.message === 'pending_approval') {
                return { pendingApproval: true };
            }

            const { token, user } = res.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("loginTimestamp", Date.now().toString());
            setUser(user);
            setSessionExpiredMsg(false);
            return { pendingApproval: false };
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const updateUser = (updatedUser) => {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loginTimestamp");
        setUser(null);
    };

    const dismissExpiredMsg = () => {
        setSessionExpiredMsg(false);
    };

    const value = {
        user,
        login,
        register,
        updateUser,
        logout,
        loading,
        sessionExpiredMsg,
        dismissExpiredMsg,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Session expired toast notification */}
            {sessionExpiredMsg && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    background: '#2d3748',
                    color: '#f7fafc',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #4a5568',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    maxWidth: '90vw',
                    width: 'fit-content',
                    animation: 'fadeInDown 0.4s ease-out',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                }}>
                    <span style={{ fontSize: '1.3rem' }}>⏰</span>
                    <span>Tu sesión ha expirado. Por favor, inicia sesión de nuevo.</span>
                    <button
                        onClick={dismissExpiredMsg}
                        style={{
                            background: 'rgba(255,255,255,0.25)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            flexShrink: 0,
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
};
