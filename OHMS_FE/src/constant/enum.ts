export const LOGIN_USER = "accessToken";
export const BACKEND_URL ="http://localhost:8080";

const OAUTH2_REDIRECT_URI = "http://localhost:5173/oauth2/redirect";
export const GOOGLE_AUTH_URL = BACKEND_URL + "/oauth2/authorize/google?redirect_uri=" + OAUTH2_REDIRECT_URI;