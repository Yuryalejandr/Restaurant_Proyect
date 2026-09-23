// Production is reachable from the APK. Override this with the LAN URL in mobile/.env for local development.
const DEFAULT_API_URL = 'https://zeloura-api.onrender.com/api';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
