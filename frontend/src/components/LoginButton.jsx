import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const LoginButton = () => {
    const { login, register } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [acceptEula, setAcceptEula] = useState(false);

    const toggleModal = () => {
        setIsOpen(!isOpen);
        setIsRegisterMode(false);
        setEmail('');
        setPassword('');
        setName('');
        setErrorMessage('');
        setAcceptEula(false);
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            if (isRegisterMode) {
                if (!email || !password || !name) {
                    setErrorMessage('Todos los campos son obligatorios');
                    setIsLoading(false);
                    return;
                }
                if (!acceptEula) {
                    setErrorMessage('Debes aceptar los Términos y Condiciones (EULA) para registrarte');
                    setIsLoading(false);
                    return;
                }
                const result = await register({ email, password, name });
                localStorage.setItem('eula_accepted_' + email, 'true');
                if (result?.pendingApproval) {
                    toggleModal();
                    Swal.fire({
                        title: '¡Registro en Standby!',
                        text: 'Tu cuenta se ha registrado correctamente, pero está a la espera de aprobación por parte de un administrador. Se te dará acceso pronto.',
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#3085d6'
                    });
                } else {
                    toggleModal();
                    Swal.fire({
                        title: '¡Bienvenido!',
                        text: 'Te has registrado e iniciado sesión con éxito.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } else {
                if (!email || !password) {
                    setErrorMessage('Por favor ingresa correo y contraseña');
                    setIsLoading(false);
                    return;
                }

                // Check if EULA is accepted for this email
                const hasAcceptedEula = localStorage.getItem('eula_accepted_' + email) === 'true';

                if (!hasAcceptedEula) {
                    setIsLoading(false);
                    const eulaResult = await Swal.fire({
                        title: 'Acuerdo de Licencia de Usuario Final (EULA)',
                        html: `
                            <div style="text-align: left; max-height: 300px; overflow-y: auto; font-size: 0.9rem; padding: 10px; color: #334155; line-height: 1.5;">
                                <p><strong>1. Aceptación de los Términos</strong><br/>Al iniciar sesión y usar CARTATECA, aceptas cumplir con esta Licencia de Usuario Final.</p>
                                <p><strong>2. Conducta del Usuario</strong><br/>No se tolerará ningún tipo de contenido inapropiado, abusivo, acosador o fraudulento. Los usuarios son responsables por las cartas que publican y venden.</p>
                                <p><strong>3. Moderación y Sanciones</strong><br/>Los administradores de CARTATECA se reservan el derecho de suspender o eliminar cualquier cuenta que infrinja estas normas de convivencia o realice actividades sospechosas.</p>
                                <p><strong>4. Exclusión de Responsabilidad</strong><br/>CARTATECA actúa únicamente como intermediario técnico de exhibición. No nos responsabilizamos por las transacciones financieras o físicas realizadas entre usuarios.</p>
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Aceptar y Entrar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#6366f1',
                        cancelButtonColor: '#d33',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });

                    if (eulaResult.isConfirmed) {
                        localStorage.setItem('eula_accepted_' + email, 'true');
                        setIsLoading(true);
                    } else {
                        setErrorMessage('Debes aceptar el EULA / Términos de Servicio para poder ingresar.');
                        return;
                    }
                }

                await login({ email, password });
                toggleModal();
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '¡Sesión iniciada!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
            }
        } catch (error) {
            console.error(error);
            const status = error.response?.status;
            const msg = error.response?.data?.message;

            if (status === 403 && msg === 'pending_approval') {
                toggleModal();
                Swal.fire({
                    title: 'Cuenta en espera',
                    text: 'Tu cuenta aún está pendiente de aprobación por el administrador.',
                    icon: 'info',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#3085d6'
                });
            } else if (status === 403 && msg === 'account_banned') {
                toggleModal();
                Swal.fire({
                    title: 'Cuenta suspendida',
                    text: 'Tu cuenta ha sido baneada del sistema.',
                    icon: 'error',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#d33'
                });
            } else {
                setErrorMessage(msg || 'Ocurrió un error. Verifica tus credenciales e intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Auth Trigger Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                    onClick={() => {
                        setIsOpen(true);
                        setIsRegisterMode(false);
                    }}
                    style={{
                        background: 'transparent',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = '#ffffff';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                >
                    Iniciar Sesión
                </button>

                <button 
                    onClick={() => {
                        setIsOpen(true);
                        setIsRegisterMode(true);
                    }}
                    style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(59, 130, 246, 0.35)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.25)';
                    }}
                >
                    Registrarse
                </button>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    animation: 'fadeIn 0.25s ease-out'
                }}>
                    {/* Modal Card */}
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                        width: '100%',
                        maxWidth: '420px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        overflow: 'hidden',
                        color: '#f8fafc',
                        position: 'relative',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Header Banner */}
                        <div style={{
                            padding: '24px 24px 16px',
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#6366f1' }}>
                                    {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                    {isRegisterMode ? 'Únete a Poke TCG y gestiona tu colección' : 'Bienvenido de nuevo a tu portal TCG'}
                                </p>
                            </div>
                            <button 
                                onClick={toggleModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    transition: 'color 0.2s',
                                    lineHeight: '1'
                                }}
                                onMouseOver={e => e.currentTarget.style.color = '#f1f5f9'}
                                onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            {errorMessage && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    color: '#fca5a5',
                                    fontSize: '0.85rem',
                                    marginBottom: '16px',
                                    fontWeight: '500'
                                }}>
                                    ⚠️ {errorMessage}
                                </div>
                            )}

                            {isRegisterMode && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre completo</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ej. Ash Ketchum"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #334155',
                                            background: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                        onBlur={e => e.currentTarget.style.borderColor = '#334155'}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="entrenador@pokemon.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #334155',
                                        background: '#0f172a',
                                        color: '#ffffff',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#334155'}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #334155',
                                        background: '#0f172a',
                                        color: '#ffffff',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#334155'}
                                />
                            </div>

                            {isRegisterMode && (
                                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="eula-checkbox"
                                        checked={acceptEula}
                                        onChange={e => setAcceptEula(e.target.checked)}
                                        style={{ marginTop: '3px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="eula-checkbox" style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer', lineHeight: '1.4' }}>
                                        Acepto el <span 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                Swal.fire({
                                                    title: 'Acuerdo de Licencia de Usuario Final (EULA)',
                                                    html: `
                                                        <div style="text-align: left; max-height: 300px; overflow-y: auto; font-size: 0.9rem; padding: 10px; color: #334155; line-height: 1.5;">
                                                            <p><strong>1. Aceptación de los Términos</strong><br/>Al registrarte en CARTATECA, aceptas cumplir con esta Licencia de Usuario Final.</p>
                                                            <p><strong>2. Conducta del Usuario</strong><br/>No se tolerará ningún tipo de contenido inapropiado, abusivo, acosador o fraudulento. Los usuarios son responsables por las cartas que publican y venden.</p>
                                                            <p><strong>3. Moderación y Sanciones</strong><br/>Los administradores de CARTATECA se reservan el derecho de suspender o eliminar cualquier cuenta que infrinja estas normas de convivencia o realice actividades sospechosas.</p>
                                                            <p><strong>4. Exclusión de Responsabilidad</strong><br/>CARTATECA actúa únicamente como intermediario técnico de exhibición. No nos responsabilizamos por las transacciones financieras o físicas realizadas entre usuarios.</p>
                                                        </div>
                                                    `,
                                                    confirmButtonText: 'Entendido',
                                                    confirmButtonColor: '#6366f1'
                                                });
                                            }}
                                            style={{ color: '#6366f1', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            EULA / Términos de Servicio
                                        </span>
                                    </label>
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                                onMouseOver={e => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                                    }
                                }}
                            >
                                {isLoading ? 'Cargando...' : isRegisterMode ? 'Registrarme' : 'Entrar'}
                            </button>

                            <div style={{
                                marginTop: '20px',
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                color: '#94a3b8'
                            }}>
                                {isRegisterMode ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6366f1',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginLeft: '6px',
                                        padding: 0,
                                        fontSize: '0.85rem',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {isRegisterMode ? 'Inicia Sesión' : 'Regístrate aquí'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Injected animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(16px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default LoginButton;
