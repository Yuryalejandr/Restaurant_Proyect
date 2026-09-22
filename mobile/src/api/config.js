// For Expo Go on a phone, use the computer's LAN IPv4 (not the WSL address)
// and keep both devices on the same Wi-Fi. Override this value in .env.
const DEFAULT_API_URL = 'http://192.168.1.8:3000/api';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
