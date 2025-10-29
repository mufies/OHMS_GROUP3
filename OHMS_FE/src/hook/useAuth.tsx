export function validateJwt(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }

    try {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;
        if (typeof exp !== 'number') {
            return false;
        }
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime < exp;

    }
    catch {
        return false;
    }
}

export function getUserIdFromToken(): string | null {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return payload.userId || null;
    } catch (error) {
        console.error('Error getting userId from token:', error);
        return null;
    }
}


