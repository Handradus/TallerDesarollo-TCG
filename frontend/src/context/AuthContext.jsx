import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { EULA_CLAUSES } from "../utils/eula";
import Swal from "sweetalert2";

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
    const [forceAccepted, setForceAccepted] = useState(false);

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
            // Legacy: no loginTimestamp yet — set it now
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

    const login = async (googleData) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`, {
                token: googleData.credential,
            });

            const { token, user, isNewUser } = res.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("loginTimestamp", Date.now().toString());
            setUser(user);
            setSessionExpiredMsg(false);
            setForceAccepted(false); // Reset checkbox
            return { isNewUser };
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loginTimestamp");
        setUser(null);
        setForceAccepted(false);
    };

    const dismissExpiredMsg = () => {
        setSessionExpiredMsg(false);
    };

    // Call API to accept EULA for existing users
    const acceptUserEula = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/accept-eula`, 
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUser = res.data.user;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setForceAccepted(false);
            Swal.fire('¡Gracias!', 'Has aceptado los nuevos Términos y Condiciones correctamente.', 'success');
        } catch (error) {
            console.error("Failed to accept EULA:", error);
            Swal.fire('Error', 'No se pudo registrar tu aceptación. Inténtalo de nuevo.', 'error');
        }
    };

    const value = {
        user,
        login,
        logout,
        loading,
        sessionExpiredMsg,
        dismissExpiredMsg,
        acceptUserEula
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

            {/* UNBYPASSABLE FORCE EULA OVERLAY MODAL */}
            {user && !user.acceptedTerms && (
                <div 
                    className="modal-overlay" 
                    style={{ 
                        zIndex: 12000, 
                        position: 'fixed', 
                        inset: 0, 
                        background: 'rgba(10, 15, 30, 0.9)', 
                        backdropFilter: 'blur(8px)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}
                >
                    <div 
                        className="modal-content" 
                        style={{ 
                            maxWidth: '650px', 
                            width: '92%', 
                            maxHeight: '85vh', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            padding: '25px', 
                            borderRadius: '16px', 
                            background: 'white',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <h2 style={{ 
                            marginTop: 0, 
                            marginBottom: '15px', 
                            color: '#1a202c', 
                            fontSize: '1.4rem', 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderBottom: '2px solid #edf2f7', 
                            paddingBottom: '10px' 
                        }}>
                            ⚖️ Actualización de Términos y Condiciones
                        </h2>
                        
                        <p style={{ 
                            fontSize: '0.9rem', 
                            color: '#4a5568', 
                            margin: '0 0 15px 0', 
                            textAlign: 'left',
                            lineHeight: '1.5'
                        }}>
                            Hemos actualizado nuestros Términos y Condiciones de Uso. Para continuar utilizando tu cuenta de Cartateca, por favor lee y acepta los nuevos acuerdos:
                        </p>
                        
                        {/* Scrollable EULA Clauses */}
                        <div
                            style={{
                                flexGrow: 1,
                                overflowY: 'auto',
                                paddingRight: '10px',
                                marginBottom: '20px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '15px',
                                background: '#f8fafc',
                                maxHeight: '35vh',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                color: '#4a5568',
                                lineHeight: '1.6'
                            }}
                        >
                            {EULA_CLAUSES.map((clause) => (
                                <div key={clause.id} style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '0.95rem', color: '#2d3748', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                                        {clause.title}
                                    </h3>
                                    {clause.paragraphs.map((p, idx) => (
                                        <p key={idx} style={{ margin: '0 0 8px 0', textIndent: p.startsWith('*') ? '15px' : '0' }}>
                                            {p}
                                        </p>
                                    ))}
                                </div>
                            ))}
                        </div>
                        
                        {/* Consent Checkbox */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '20px',
                                userSelect: 'none',
                                textAlign: 'left'
                            }}
                        >
                            <input
                                type="checkbox"
                                id="force-eula-checkbox"
                                checked={forceAccepted}
                                onChange={(e) => setForceAccepted(e.target.checked)}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#4285F4'
                                }}
                            />
                            <label
                                htmlFor="force-eula-checkbox"
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    color: '#2d3748',
                                    cursor: 'pointer'
                                }}
                            >
                                He leído y acepto los Términos y Condiciones de Uso
                            </label>
                        </div>
                        
                        {/* Action buttons */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: '10px', 
                            borderTop: '1px solid #edf2f7', 
                            paddingTop: '15px' 
                        }}>
                            <button 
                                onClick={logout} 
                                className="btn-secondary" 
                                style={{ 
                                    padding: '10px 18px', 
                                    borderRadius: '8px', 
                                    fontSize: '0.9rem', 
                                    cursor: 'pointer',
                                    background: '#edf2f7',
                                    border: 'none',
                                    fontWeight: '600',
                                    color: '#4a5568',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#edf2f7'}
                            >
                                Cancelar / Cerrar Sesión
                            </button>
                            <button
                                onClick={acceptUserEula}
                                disabled={!forceAccepted}
                                className="btn-primary"
                                style={{
                                    background: forceAccepted ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : '#cbd5e0',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: forceAccepted ? 'pointer' : 'not-allowed',
                                    boxShadow: forceAccepted ? '0 4px 12px rgba(102, 126, 234, 0.25)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Aceptar y Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conditionally blur app background only when user is logged in but hasn't accepted EULA */}
            {(!user || user.acceptedTerms) ? children : (
                <div style={{ filter: 'blur(6px)', pointerEvents: 'none', minHeight: '100vh' }}>
                    {children}
                </div>
            )}
        </AuthContext.Provider>
    );
};
