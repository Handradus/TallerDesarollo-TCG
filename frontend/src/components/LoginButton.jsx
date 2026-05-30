import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const LoginButton = () => {
    const { login } = useAuth();

    const onSuccess = async (credentialResponse) => {
        try {
            await login(credentialResponse);
        } catch (error) {
            if (error.response?.status === 403) {
                const msg = error.response.data?.message;
                if (msg === 'pending_approval') {
                    Swal.fire({
                        title: '¡Registro en Standby!',
                        text: 'Tu cuenta está a la espera de aprobación por parte de un administrador. Se te dará acceso pronto.',
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#3085d6'
                    });
                } else if (msg === 'account_banned') {
                    Swal.fire({
                        title: 'Cuenta bloqueada',
                        text: 'Tu cuenta ha sido bloqueada y no puede acceder a la plataforma.',
                        icon: 'error',
                        confirmButtonText: 'Cerrar'
                    });
                } else {
                    Swal.fire({
                        title: 'Acceso denegado',
                        text: 'No tienes permiso para acceder a la plataforma.',
                        icon: 'error'
                    });
                }
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
        Swal.fire('Error', 'No se pudo completar el acceso con Google.', 'error');
    };

    return (
        <div className="login-button-container" style={{ display: 'flex', alignItems: 'center' }}>
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
    );
};

export default LoginButton;
