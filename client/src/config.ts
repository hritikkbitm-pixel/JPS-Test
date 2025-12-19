const isProd = process.env.NODE_ENV === 'production';

// If NEXT_PUBLIC_API_URL is missing, we default to /api in production (to allow relative proxies)
// and localhost:5001 in development.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || (isProd ? '/api' : 'http://localhost:5001/api');

// Helper to determine if we are in production
export const IS_PROD = isProd;
