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
            if (error.response && error.response.status === 403 && error.response.data?.message === 'pending_approval') {
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
    };

    return (
        <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            ux_mode="popup"
        />
    );
};

export default LoginButton;
