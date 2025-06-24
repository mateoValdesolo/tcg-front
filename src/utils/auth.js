import { jwtDecode } from 'jwt-decode';

export function getUserIdFromCredential(credential) {
    const decoded = jwtDecode(credential);
    return decoded.sub; // Identificador único de Google
}