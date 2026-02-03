import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const LoginButton = () => {
    const { login } = useAuth();

    const onSuccess = (credentialResponse) => {
        login(credentialResponse);
    };

    const onError = () => {
        console.log('Login Failed');
    };

    return (
        <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            useOneTap
        />
    );
};

export default LoginButton;
