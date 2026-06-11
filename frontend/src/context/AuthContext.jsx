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
    // Holds Google data for a NEW user who hasn't accepted EULA yet (no account in DB)
    const [pendingGoogleData, setPendingGoogleData] = useState(null);
    const [eulaRegistrationAccepted, setEulaRegistrationAccepted] = useState(false);

    // Check session validity on mount
<<<<<<< HEAD
    // ⚠️ SECURITY: Token in sessionStorage (cleared on browser close)
=======
    // ⚠️ SECURITY: Token stored in sessionStorage (cleared on browser close)
    // User data (non-sensitive) in localStorage for persistence
>>>>>>> a3334e6898bd9682bac048e019d76571ec00e573
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const loginTimestamp = sessionStorage.getItem("loginTimestamp");

        if (token && storedUser && loginTimestamp) {
            const elapsed = Date.now() - parseInt(loginTimestamp, 10);
            if (elapsed > SESSION_DURATION_MS) {
                // Session expired — clear everything and show message
                sessionStorage.removeItem("token");
<<<<<<< HEAD
                localStorage.removeItem("user");
                sessionStorage.removeItem("loginTimestamp");
=======
                sessionStorage.removeItem("loginTimestamp");
                localStorage.removeItem("user");
>>>>>>> a3334e6898bd9682bac048e019d76571ec00e573
                setSessionExpiredMsg(true);
            } else {
                setUser(JSON.parse(storedUser));
            }
        } else if (token && storedUser) {
            // Legacy: no loginTimestamp yet — set it now
            sessionStorage.setItem("loginTimestamp", Date.now().toString());
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

<<<<<<< HEAD
    // Setup axios interceptors: auto-attach token + auto-logout on 401/403
    // ⚠️ SECURITY: Request interceptor adds token from sessionStorage to all requests
    useEffect(() => {
        // Request interceptor: Automatically add token to Authorization header
=======
    // Setup axios interceptor: auto-logout on 401/403 & auto-attach token
    // ⚠️ SECURITY: Automatically adds token to Authorization header from sessionStorage
    useEffect(() => {
        // Request interceptor: Add token to headers
>>>>>>> a3334e6898bd9682bac048e019d76571ec00e573
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = sessionStorage.getItem("token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
<<<<<<< HEAD
                config.withCredentials = true; // For future HttpOnly cookie support
=======
                // Enable credentials for cookies (if backend supports HttpOnly cookies)
                config.withCredentials = true;
>>>>>>> a3334e6898bd9682bac048e019d76571ec00e573
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor: Handle 401/403
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
<<<<<<< HEAD
=======
                    // Check if user is currently logged in — if so, token has expired
>>>>>>> a3334e6898bd9682bac048e019d76571ec00e573
                    const token = sessionStorage.getItem("token");
                    if (token) {
                        const msg = error.response.data?.message;
                        if (msg !== 'pending_approval' && msg !== 'account_banned') {
                            sessionStorage.removeItem("token");
                            sessionStorage.removeItem("loginTimestamp");
                            localStorage.removeItem("user");
                            setUser(null);
                            setSessionExpiredMsg(true);
                        }
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);
// ⚠️ SECURITY: Token in sessionStorage (cleared on browser close)
            sessionStorage.setItem("token", token);
            // User data in localStorage (safe to persist, doesn't include token)
            localStorage.setItem("user", JSON.stringify(user));
            session
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`, {
                token: googleData.credential,
            });

            const { requiresEula, token, user } = res.data;

            if (requiresEula) {
                // New user — store their Google data and show EULA modal before creating account
                setPendingGoogleData({
                    ...res.data.googleData,
                    credential: googleData.credential,
                });
                return { requiresEula: true };
            }

            // Existing user — complete login normally
            // ⚠️ SECURITY: Token in sessionStorage (cleared when browser closes)
            sessionStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            sessionStorage.setItem("loginTimestamp", Date.now().toString());
            setUser(user);
            setSessionExpiredMsg(false);
            setForceAccepted(false);
            return { requiresEula: false };
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    // Called when a new user accepts the EULA and wants to complete registration
    const registerWithEula = async () => {
        if (!pendingGoogleData) return;
        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/google/register`,
                { token: pendingGoogleData.credential }
            );
            // Account created — now pending admin approval
            setPendingGoogleData(null);
            setEulaRegistrationAccepted(false);
            Swal.fire({
                title: '¡Registro completado!',
                text: 'Tu cuenta está a la espera de aprobación por parte de un administrador. Se te dará acceso pronto.',
                icon: 'info',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6'
            });
        } catch (error) {
            const msg = error.response?.data?.message;
            if (msg === 'account_already_exists') {
                // Race condition — account was created between steps, just let them log in
                setPendingGoogleData(null);
                setEulaRegistrationAccepted(false);
                Swal.fire('Cuenta existente', 'Tu cuenta ya existe. Intenta iniciar sesión nuevamente.', 'info');
            } else {
                console.error("Registration failed:", error);
                Swal.fire('Error', 'No se pudo completar el registro. Inténtalo de nuevo.', 'error');
            }
        }
    };

    // Called when a new user rejects the EULA — clears pending data, no account created
    const cancelEulaRegistration = () => {
        setPendingGoogleData(null);
        setEulaRegistrationAccepted(false);
    };
<<<<<<< HEAD

    const logout = () => {
        // ⚠️ SECURITY: Remove token from sessionStorage + user from localStorage
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("loginTimestamp");
=======
sessionStorage.removeItem("token");
        sessionStorage.removeItem("loginTimestamp");
        localStorage.removeItem("user
>>>>>>> a3334e6898bd9682bac048e019d76571ec00e573
        localStorage.removeItem("user");
        setUser(null);
        setForceAccepted(false);
    };

    const dismissExpiredMsg = () => {
        setSessionExpiredMsg(false);
    };

    // Call API to accept EULA for existing users
    // ⚠️ SECURITY: Token automatically added by axios interceptor
    const acceptUserEula = async () => {
        try {
            const token = sessionStorage.getItem("token");
            if (!token) return;

            // Token is automatically added to Authorization header by interceptor
            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/accept-eula`, 
                {}
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
        acceptUserEula,
        pendingGoogleData,
        cancelEulaRegistration,
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

            {/* ── NEW USER REGISTRATION EULA MODAL ── */}
            {/* Shown BEFORE account is created — no user in DB yet */}
            {pendingGoogleData && (
                <div
                    className="modal-overlay"
                    style={{
                        zIndex: 12000,
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(10, 15, 30, 0.92)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                            padding: '28px',
                            borderRadius: '18px',
                            background: 'white',
                            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.5)',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {/* Header con datos del nuevo usuario */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', borderBottom: '2px solid #edf2f7', paddingBottom: '14px' }}>
                            {pendingGoogleData.picture && (
                                <img
                                    src={pendingGoogleData.picture}
                                    alt={pendingGoogleData.name}
                                    style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #e2e8f0' }}
                                />
                            )}
                            <div style={{ textAlign: 'left' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1a202c' }}>
                                    ⚖️ Términos y Condiciones de Uso
                                </h2>
                                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#718096' }}>
                                    Bienvenido/a, <strong>{pendingGoogleData.name}</strong>. Antes de crear tu cuenta, lee y acepta nuestros términos.
                                </p>
                            </div>
                        </div>

                        {/* Scrollable EULA Clauses */}
                        <div
                            style={{
                                flexGrow: 1,
                                overflowY: 'auto',
                                marginBottom: '20px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '15px',
                                background: '#f8fafc',
                                maxHeight: '35vh',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                color: '#4a5568',
                                lineHeight: '1.6',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', userSelect: 'none', textAlign: 'left' }}>
                            <input
                                type="checkbox"
                                id="register-eula-checkbox"
                                checked={eulaRegistrationAccepted}
                                onChange={(e) => setEulaRegistrationAccepted(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4285F4' }}
                            />
                            <label
                                htmlFor="register-eula-checkbox"
                                style={{ fontSize: '0.95rem', fontWeight: '600', color: '#2d3748', cursor: 'pointer' }}
                            >
                                He leído y acepto los Términos y Condiciones de Uso
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
                            <button
                                onClick={cancelEulaRegistration}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    background: '#edf2f7',
                                    border: 'none',
                                    fontWeight: '600',
                                    color: '#4a5568',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#edf2f7'}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={registerWithEula}
                                disabled={!eulaRegistrationAccepted}
                                style={{
                                    background: eulaRegistrationAccepted ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : '#cbd5e0',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: eulaRegistrationAccepted ? 'pointer' : 'not-allowed',
                                    boxShadow: eulaRegistrationAccepted ? '0 4px 12px rgba(102, 126, 234, 0.25)' : 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Crear cuenta y continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EXISTING USER FORCE EULA UPDATE MODAL ── */}
            {/* Shown when user already has account but needs to accept updated terms */}
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
