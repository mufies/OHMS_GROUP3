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

