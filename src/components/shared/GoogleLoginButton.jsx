import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { getUserIdFromCredential } from '../../utils/auth';

export function GoogleLoginButton({ onLogin }) {
    return (
        <GoogleLogin
            onSuccess={credentialResponse => {
                const userId = getUserIdFromCredential(credentialResponse.credential);
                onLogin(userId);
            }}
            onError={() => {
                console.log('Login fallido');
            }}
        />
    );
}