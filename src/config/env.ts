// Environment configuration
const getApiUrl = (): string => {
  // In production (Vercel), use the proxied path
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, use the direct URL
  return import.meta.env.VITE_API_URL || 'http://141.196.166.241:8003';
};

export const config = {
  apiUrl: getApiUrl(),
} as const; 