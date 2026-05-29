import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { EULA_CLAUSES } from '../utils/eula';
import Swal from 'sweetalert2';

const LoginButton = () => {
    const { login } = useAuth();
    const [showEulaModal, setShowEulaModal] = useState(false);
    const [eulaAccepted, setEulaAccepted] = useState(false);

    const onSuccess = async (credentialResponse) => {
        try {
            await login(credentialResponse);
            setShowEulaModal(false);
            setEulaAccepted(false); // Reset
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data?.message === 'pending_approval') {
                setShowEulaModal(false);
                setEulaAccepted(false);
                Swal.fire({
                    title: '¡Registro en Standby!',
                    text: 'Tu cuenta se ha registrado correctamente, pero está a la espera de aprobación por parte de un administrador. Se te dará acceso pronto.',
                    icon: 'info',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                console.error(error);
                Swal.fire({
                    title: 'Error de acceso',
                    text: 'Hubo un problema al iniciar sesión. Inténtalo más tarde.',
                    icon: 'error'
                });
            }
        }
    };

    const onError = () => {
        console.log('Login Failed');
        Swal.fire('Error', 'No se pudo completar el inicio de sesión con Google.', 'error');
    };

    return (
        <div className="login-button-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* 1. Registrarse (Custom Button that launches EULA) */}
            <button
                onClick={() => {
                    setShowEulaModal(true);
                    setEulaAccepted(false); // Reset state
                }}
                className="btn-google-custom"
                style={{
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(118, 75, 162, 0.25)',
                    transition: 'all 0.3s ease',
                    height: '36px'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(118, 75, 162, 0.35)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(118, 75, 162, 0.25)';
                }}
            >
                📝 Registrarse
            </button>

            {/* 2. Iniciar Sesión (Standard Google Login directly, no EULA required again) */}
            <div style={{ height: '36px', display: 'flex', alignItems: 'center' }}>
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={onError}
                    ux_mode="popup"
                    text="signin_with"
                    shape="rectangular"
                    theme="filled_blue"
                    size="medium"
                />
            </div>

            {/* EULA Verification Overlay Modal */}
            {showEulaModal && (
                <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setShowEulaModal(false)}>
                    <div
                        className="modal-content eula-modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '650px',
                            width: '92%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '25px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <button className="modal-close" onClick={() => setShowEulaModal(false)}>&times;</button>
                        
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
                            ⚖️ Términos y Condiciones de Uso
                        </h2>

                        {/* Scrollable EULA clauses container */}
                        <div
                            className="eula-scroll-container"
                            style={{
                                flexGrow: 1,
                                overflowY: 'auto',
                                paddingRight: '10px',
                                marginBottom: '20px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '15px',
                                background: '#f8fafc',
                                maxHeight: '40vh',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                color: '#4a5568',
                                lineHeight: '1.6'
                            }}
                        >
                            <p style={{ marginTop: 0, fontWeight: '600', color: '#2d3748' }}>
                                Por favor, lee atentamente los siguientes Términos y Condiciones antes de continuar con la creación de tu cuenta en Cartateca:
                            </p>
                            {EULA_CLAUSES.map((clause) => (
                                <div key={clause.id} style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#2d3748', margin: '0 0 8px 0', fontWeight: 'bold' }}>
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

                        {/* Data import disclaimer */}
                        <div
                            className="eula-info-banner"
                            style={{
                                background: 'rgba(66, 133, 244, 0.08)',
                                borderLeft: '4px solid #4285F4',
                                padding: '12px 15px',
                                borderRadius: '0 8px 8px 0',
                                marginBottom: '20px',
                                fontSize: '0.85rem',
                                color: '#2b6cb0',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                lineHeight: '1.5'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>ℹ️</span>
                            <span>
                                <strong>Importación de Datos:</strong> Tu nombre de usuario y avatar iniciales se obtendrán automáticamente de tu cuenta de Google vinculada. Podrás modificarlos más tarde en tu sección de Perfil si lo estimas conveniente.
                            </span>
                        </div>

                        {/* Checkbox agreement */}
                        <div
                            className="eula-checkbox-container"
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
                                id="accept-eula-checkbox"
                                checked={eulaAccepted}
                                onChange={(e) => setEulaAccepted(e.target.checked)}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#4285F4'
                                }}
                            />
                            <label
                                htmlFor="accept-eula-checkbox"
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

                        {/* Google Sign In wrapper */}
                        <div
                            className="eula-action-area"
                            style={{
                                borderTop: '1px solid #edf2f7',
                                paddingTop: '15px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minHeight: '60px',
                                justifyContent: 'center'
                            }}
                        >
                            {eulaAccepted ? (
                                <div className="fade-in" style={{ animation: 'fadeIn 0.4s ease' }}>
                                    <GoogleLogin
                                        onSuccess={onSuccess}
                                        onError={onError}
                                        ux_mode="popup"
                                        text="signup_with"
                                    />
                                </div>
                            ) : (
                                <p style={{ color: '#a0aec0', fontSize: '0.85rem', margin: 0 }}>
                                    Debes aceptar los Términos y Condiciones para habilitar el registro con Google.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginButton;
