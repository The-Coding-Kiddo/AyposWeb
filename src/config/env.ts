// Environment configuration
const getApiUrl = (): string => {
  // Use environment variable if available, fallback to development URL
  return import.meta.env.VITE_API_URL || 'http://141.196.166.241:8003';
};

export const config = {
  apiUrl: getApiUrl(),
} as const; 